import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import FormData from 'form-data';

export class Tiiny implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tiiny',
		name: 'tiiny',
		icon: { light: 'file:tiiny.svg', dark: 'file:tiiny.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Upload HTML, PDF, or ZIP to Tiiny and return link',
		defaults: { name: 'Tiiny' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'tiinyApi', required: true }],
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property that contains the file',
				required: true,
			},
			{
				displayName: 'Subdomain',
				name: 'subdomain',
				type: 'string',
				default: '',
				placeholder: 'mysite',
				description: 'Optional subdomain. If set, domain becomes <subdomain><domainSuffix>.',
			},
			{
				displayName: 'Domain Suffix',
				name: 'domainSuffix',
				type: 'string',
				default: '.tiiny.site',
				description: 'Domain suffix appended to subdomain',
			},
			{
				displayName: 'Password Protected',
				name: 'passwordProtected',
				type: 'boolean',
				default: false,
				description: 'Whether the uploaded site should be password protected',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				displayOptions: { show: { passwordProtected: [true] } },
				description: 'Password when password protection is enabled',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
				const subdomain = this.getNodeParameter('subdomain', itemIndex, '') as string;
				const domainSuffix = this.getNodeParameter('domainSuffix', itemIndex, '.tiiny.site') as string;
				const passwordProtected = this.getNodeParameter('passwordProtected', itemIndex, false) as boolean;
				const password = this.getNodeParameter('password', itemIndex, '') as string;
				const apiBaseUrl = 'http://localhost:8000/v3' as string;

				const item = items[itemIndex];
				if (!item.binary || !item.binary[binaryPropertyName]) {
					throw new NodeOperationError(this.getNode(), `No binary data property '${binaryPropertyName}' found`, { itemIndex });
				}

				// Get binary data
				const binaryData = item.binary[binaryPropertyName];
				const fileBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
				const fileName = binaryData.fileName || 'file';
				const mimeType = binaryData.mimeType || 'application/octet-stream';

				// ✅ Create FormData instead of using useFormData
				const formData = new FormData();
				formData.append('domainSuffix', domainSuffix);
				formData.append('siteSettings', JSON.stringify({ passwordProtected, password: password || '' }));
				formData.append('filesToAdd', fileBuffer, { filename: fileName, contentType: mimeType });

				if (subdomain && subdomain.trim() !== '') {
					formData.append('domain', `${subdomain}${domainSuffix}`);
				}

				const options: IHttpRequestOptions = {
					method: 'POST',
					url: `${apiBaseUrl.replace(/\/$/, '')}/external/pub/upload`,
					headers: formData.getHeaders(), // important!
					body: formData as unknown as IDataObject,
					returnFullResponse: true,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'tiinyApi', options);
				const responseData = (response as any).body ?? response;
				const link = responseData?.link || responseData?.data?.link;

				if (!link) {
					throw new NodeOperationError(this.getNode(), 'No link returned from API', { itemIndex });
				}

				returnData.push({
					json: {
						link,
						fileName,
						subdomain: subdomain || '',
						passwordProtected,
						originalResponse: responseData,
					},
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as any).message }, pairedItem: { item: itemIndex } });
				} else {
					if ((error as any).context) {
						(error as any).context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}

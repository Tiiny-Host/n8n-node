import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';

export const createProperties: INodeProperties[] = [
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'Name of the binary property that contains the file',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		required: true,
	},
	{
		displayName: 'Subdomain',
		name: 'subdomain',
		type: 'string',
		default: '',
		placeholder: 'mysite',
		description: 'Optional subdomain. If set, domain becomes <subdomain><domainSuffix>.',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Domain Suffix',
		name: 'domainSuffix',
		type: 'options',
		default: '.tiiny.site',
		description: 'Domain suffix appended to subdomain',
		typeOptions: {
			loadOptionsMethod: 'getDomainSuffixes',
		},
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Password Protected',
		name: 'passwordProtected',
		type: 'boolean',
		default: false,
		description: 'Whether the uploaded site should be password protected',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Password',
		name: 'password',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				passwordProtected: [true],
			},
		},
		description: 'Password when password protection is enabled',
	},
];

export async function executeCreate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const apiBaseUrl = 'https://api.tiiny.host/v3';

	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const subdomain = this.getNodeParameter('subdomain', itemIndex, '') as string;
	const domainSuffix = this.getNodeParameter('domainSuffix', itemIndex, '.tiiny.site') as string;
	const passwordProtected = this.getNodeParameter('passwordProtected', itemIndex, false) as boolean;
	const password = this.getNodeParameter('password', itemIndex, '') as string;

	// Use assertBinaryData like Pushover does
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const fileBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	// Base64 encode to prevent corruption when sent as text field
	const fileBase64 = fileBuffer.toString('base64');

	// Build multipart form data
	const body: IDataObject = {
		domainSuffix,
		siteSettings: JSON.stringify({ passwordProtected, password: password || '' }),
		filesToAdd: {
			value: fileBase64,
			options: {
				filename: binaryData.fileName,
				encoding: 'base64',
			},
		},
	};

	if (subdomain && subdomain.trim() !== '') {
		body.domain = `${subdomain}${domainSuffix}`;
	}

	const options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		method: 'POST',
		url: `${apiBaseUrl}/external/pub/upload`,
		body,
		json: true,
		returnFullResponse: true,
	};

	const response = await this.helpers.httpRequestWithAuthentication.call(this, 'tiinyApi', options);
	const responseData = (response as any).body ?? response;

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}

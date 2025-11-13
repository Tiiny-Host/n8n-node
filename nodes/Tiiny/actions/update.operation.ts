import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';

declare const Buffer: {
	from(
		input: string,
		encoding?: 'utf8' | 'base64',
	): {
		toString(encoding: 'base64' | 'utf8'): string;
	};
};
import { NodeOperationError } from 'n8n-workflow';

export const updateProperties: INodeProperties[] = [
	{
		displayName: 'Site Link',
		name: 'link',
		type: 'string',
		default: '',
		description: 'The link of the site to update',
		displayOptions: {
			show: {
				operation: ['update', 'updateHtml'],
			},
		},
		required: true,
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'Name of the binary property that contains the file',
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		required: true,
	},
	{
		displayName: 'Password Protected',
		name: 'passwordProtected',
		type: 'boolean',
		default: false,
		description: 'Whether the uploaded site should be password protected',
		displayOptions: {
			show: {
				operation: ['update', 'updateHtml'],
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
				operation: ['update', 'updateHtml'],
				passwordProtected: [true],
			},
		},
		description: 'Password when password protection is enabled',
	},
	{
		displayName: 'HTML Content',
		name: 'htmlContent',
		type: 'string',
		typeOptions: { rows: 10 },
		default: '',
		description: 'Raw HTML to upload as the site contents',
		displayOptions: {
			show: {
				operation: ['updateHtml'],
			},
		},
		required: true,
	},
];

function parseLinkParts(
	this: IExecuteFunctions,
	siteLink: string,
	itemIndex: number,
): { subdomain: string; domainSuffix: string } {
	const firstDotIndex = siteLink.indexOf('.');
	if (firstDotIndex === -1) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid site link format: ${siteLink}. Expected format: subdomain.domain.suffix`,
			{ itemIndex },
		);
	}
	const subdomain = siteLink.substring(0, firstDotIndex);
	const domainSuffix = '.' + siteLink.substring(firstDotIndex + 1);
	return { subdomain, domainSuffix };
}

export async function executeUpdate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const apiBaseUrl = 'https://api.tiiny.host/v3';

	const link = this.getNodeParameter('link', itemIndex) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const passwordProtected = this.getNodeParameter('passwordProtected', itemIndex, false) as boolean;
	const password = this.getNodeParameter('password', itemIndex, '') as string;

	// Parse subdomain and domain suffix from the link
	const { subdomain, domainSuffix } = parseLinkParts.call(this, link, itemIndex);

	// Use assertBinaryData like Pushover does
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const fileBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	// Base64 encode to prevent corruption when sent as text field
	const fileBase64 = fileBuffer.toString('base64');

	// Get existing files to remove
	const getSiteOptions: IHttpRequestOptions = {
		method: 'GET',
		url: `${apiBaseUrl}/external/pub/get-site`,
		qs: { domain: link },
		returnFullResponse: true,
	};

	const getSiteResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'tiinyApi',
		getSiteOptions,
	);
	const getSiteData = (getSiteResponse as any).body ?? getSiteResponse;
	const filesToRemove = getSiteData?.files || [];

	const formDataBody: IDataObject = {
		isUpdate: 'true',
		domain: `${subdomain}${domainSuffix}`,
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

	if (filesToRemove.length > 0) {
		formDataBody.filesToRemove = filesToRemove.map((file: any) =>
			JSON.stringify({ id: file.id, size: file.size }),
		);
	}

	const options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		method: 'POST',
		url: `${apiBaseUrl}/external/pub/upload`,
		body: formDataBody,
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

export async function executeUpdateFromHtml(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const apiBaseUrl = 'https://api.tiiny.host/v3';

	const link = this.getNodeParameter('link', itemIndex) as string;
	const passwordProtected = this.getNodeParameter('passwordProtected', itemIndex, false) as boolean;
	const password = this.getNodeParameter('password', itemIndex, '') as string;
	const htmlContent = this.getNodeParameter('htmlContent', itemIndex) as string;
	const htmlFileName = 'index.html';

	const { subdomain, domainSuffix } = parseLinkParts.call(this, link, itemIndex);

	const fileBuffer = Buffer.from(htmlContent, 'utf8');
	const fileBase64 = fileBuffer.toString('base64');

	const getSiteOptions: IHttpRequestOptions = {
		method: 'GET',
		url: `${apiBaseUrl}/external/pub/get-site`,
		qs: { domain: link },
		returnFullResponse: true,
	};

	const getSiteResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'tiinyApi',
		getSiteOptions,
	);
	const getSiteData = (getSiteResponse as any).body ?? getSiteResponse;
	const filesToRemove = getSiteData?.files || [];

	const formDataBody: IDataObject = {
		isUpdate: 'true',
		domain: `${subdomain}${domainSuffix}`,
		domainSuffix,
		siteSettings: JSON.stringify({ passwordProtected, password: password || '' }),
		filesToAdd: {
			value: fileBase64,
			options: {
				filename: htmlFileName || 'index.html',
				encoding: 'base64',
			},
		},
	};

	if (filesToRemove.length > 0) {
		formDataBody.filesToRemove = filesToRemove.map((file: any) =>
			JSON.stringify({ id: file.id, size: file.size }),
		);
	}

	const options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		method: 'POST',
		url: `${apiBaseUrl}/external/pub/upload`,
		body: formDataBody,
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

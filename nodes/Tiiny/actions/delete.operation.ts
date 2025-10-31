import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';

export const deleteProperties: INodeProperties[] = [
	{
		displayName: 'Site Link',
		name: 'link',
		type: 'string',
		default: '',
		description: 'The link of the site to delete (e.g., teal-darryl-81.tiiny.site)',
		displayOptions: {
			show: {
				operation: ['delete'],
			},
		},
		required: true,
	},
];

export async function executeDelete(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const apiBaseUrl = 'https://api.tiiny.host/v3';

	const link = this.getNodeParameter('link', itemIndex) as string;

	const bodyData: IDataObject = {
		link,
	};

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${apiBaseUrl}/external/pub/delete`,
		body: bodyData,
		returnFullResponse: true,
	};

	const response = await this.helpers.httpRequestWithAuthentication.call(this, 'tiinyApi', options);
	const responseData = (response as any).body ?? response;

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}

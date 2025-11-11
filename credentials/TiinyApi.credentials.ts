import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TiinyApi implements ICredentialType {
	name = 'tiinyApi';
	displayName = 'Tiiny API';
	documentationUrl = '';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			description: 'API key used for the X-Api-Key header',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Api-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	// 👇 This is the required test block for n8n credential verification
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.tiiny.host',
			url: '/v3/external/pub/profile', // or any endpoint that validates the key
			method: 'POST', // GET is preferred for testing credentials
			headers: {
				'X-Api-Key': '={{$credentials.apiKey}}',
				'user-agent': 'n8n',
			},
		},
	};
}

import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

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
}



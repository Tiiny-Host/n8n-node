import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { createProperties, executeCreate } from './actions/create.operation';
import { updateProperties, executeUpdate } from './actions/update.operation';
import { deleteProperties, executeDelete } from './actions/delete.operation';

export class Tiiny implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tiiny Host',
		name: 'tiiny',
		icon: { light: 'file:tiiny.svg', dark: 'file:tiiny.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Manage sites on Tiiny Host',
		defaults: { name: 'Tiiny Host' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'tiinyApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Site',
						value: 'create',
						description: 'Upload a new file to create a site on Tiiny',
						action: 'Create a site',
					},
					{
						name: 'Update Site',
						value: 'update',
						description: 'Update an existing site on Tiiny',
						action: 'Update a site',
					},
					{
						name: 'Delete Site',
						value: 'delete',
						description: 'Delete a site from Tiiny',
						action: 'Delete a site',
					},
				],
				default: 'create',
			},
			// Merge all operation properties
			...createProperties,
			...updateProperties,
			...deleteProperties,
		],
	};

	methods = {
		loadOptions: {
			async getDomainSuffixes(this: IExecuteFunctions | any) {
				const apiBaseUrl = 'https://api.tiiny.host';
				const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/v3/external/pub/profile`;

				const defaultSuffixes = ['tiiny.site', 'tiiny.co.uk'];

				try {
					let apiKey: string | undefined;
					try {
						const credentials = await this.getCredentials('tiinyApi');
						apiKey = credentials?.apiKey as string;
					} catch {
						// No credentials → fallback defaults
						return defaultSuffixes.map((suffix) => ({
							name: `.${suffix}`,
							value: `.${suffix}`,
						}));
					}

					if (!apiKey) {
						return defaultSuffixes.map((suffix) => ({
							name: `.${suffix}`,
							value: `.${suffix}`,
						}));
					}

					const response = await this.helpers.httpRequest.call(this, {
						method: 'POST',
						url: endpoint,
						headers: {
							'X-Api-Key': apiKey,
							'user-agent': 'n8n',
						},
					});

					const customDomains = response?.profile?.customDomains ?? [];
					const suffixes = customDomains.length > 0 ? [...customDomains, ...defaultSuffixes] : defaultSuffixes;

					return suffixes.map((suffix: string) => ({
						name: `.${suffix}`,
						value: `.${suffix}`,
					}));
				} catch (error) {
					return defaultSuffixes.map((suffix) => ({
						name: `.${suffix}`,
						value: `.${suffix}`,
					}));
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				let result: INodeExecutionData;

				// Route to the appropriate operation
				if (operation === 'create') {
					result = await executeCreate.call(this, itemIndex);
				} else if (operation === 'update') {
					result = await executeUpdate.call(this, itemIndex);
				} else if (operation === 'delete') {
					result = await executeDelete.call(this, itemIndex);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex,
					});
				}

				returnData.push(result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as any).message },
						pairedItem: { item: itemIndex },
					});
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}

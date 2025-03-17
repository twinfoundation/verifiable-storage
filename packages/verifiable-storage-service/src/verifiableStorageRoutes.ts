// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IHttpRequestContext,
	INoContentResponse,
	IRestRoute,
	ITag
} from "@twin.org/api-models";
import { ComponentFactory, Converter, Guards } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import type {
	IVerifiableStorageComponent,
	IVerifiableStorageCreateRequest,
	IVerifiableStorageCreateResponse,
	IVerifiableStorageGetRequest,
	IVerifiableStorageGetResponse,
	IVerifiableStorageRemoveRequest,
	IVerifiableStorageUpdateRequest,
	IVerifiableStorageUpdateResponse
} from "@twin.org/verifiable-storage-models";
import { HeaderTypes, HttpStatusCode } from "@twin.org/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "verifiableStorageRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsVerifiableStorage: ITag[] = [
	{
		name: "VerifiableStorage",
		description: "Endpoints which are modelled to access an Verifiable Storage."
	}
];

/**
 * The REST routes for VerifiableStorage.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesVerifiableStorage(
	baseRouteName: string,
	componentName: string
): IRestRoute[] {
	const createRoute: IRestRoute<IVerifiableStorageCreateRequest, IVerifiableStorageCreateResponse> =
		{
			operationId: "verifiableStorageCreate",
			summary: "Create an item in verifiable storage",
			tag: tagsVerifiableStorage[0].name,
			method: "POST",
			path: `${baseRouteName}/`,
			handler: async (httpRequestContext, request) =>
				verifiableStorageCreate(httpRequestContext, componentName, request),
			requestType: {
				type: nameof<IVerifiableStorageCreateRequest>(),
				examples: [
					{
						id: "verifiableStorageCreateExample",
						request: {
							body: {
								data: "SGVsbG8gd29ybGQ="
							}
						}
					}
				]
			},
			responseType: [
				{
					type: nameof<IVerifiableStorageCreateResponse>(),
					examples: [
						{
							id: "verifiableStorageCreateResponseExample",
							response: {
								statusCode: HttpStatusCode.created,
								headers: {
									[HeaderTypes.Location]:
										"verifiable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
								},
								body: {
									receipt: {
										"@context": "https://schema.twindev.org/verifiable-storage/",
										type: "VerifiableStorageIotaReceipt"
									},
									id: "verifiable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
								}
							}
						}
					]
				}
			]
		};

	const updateRoute: IRestRoute<IVerifiableStorageUpdateRequest, IVerifiableStorageUpdateResponse> =
		{
			operationId: "verifiableStorageUpdate",
			summary: "Update an item in verifiable storage",
			tag: tagsVerifiableStorage[0].name,
			method: "PUT",
			path: `${baseRouteName}/:id`,
			handler: async (httpRequestContext, request) =>
				verifiableStorageUpdate(httpRequestContext, componentName, request),
			requestType: {
				type: nameof<IVerifiableStorageUpdateRequest>(),
				examples: [
					{
						id: "verifiableStorageUpdateExample",
						request: {
							pathParams: {
								id: "verifiable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
							},
							body: {
								data: "SGVsbG8gd29ybGQ="
							}
						}
					}
				]
			},
			responseType: [
				{
					type: nameof<IVerifiableStorageUpdateResponse>(),
					examples: [
						{
							id: "verifiableStorageUpdateResponseExample",
							response: {
								body: {
									"@context": "https://schema.twindev.org/verifiable-storage/",
									type: "VerifiableStorageIotaReceipt"
								}
							}
						}
					]
				}
			]
		};

	const getRoute: IRestRoute<IVerifiableStorageGetRequest, IVerifiableStorageGetResponse> = {
		operationId: "verifiableStorageGet",
		summary: "Get an verifiable storage item",
		tag: tagsVerifiableStorage[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) => verifiableStorageGet(componentName, request),
		requestType: {
			type: nameof<IVerifiableStorageGetRequest>(),
			examples: [
				{
					id: "verifiableStorageGetExample",
					request: {
						pathParams: {
							id: "verifiable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IVerifiableStorageGetResponse>(),
				examples: [
					{
						id: "verifiableStorageGetResponseExample",
						response: {
							body: {
								data: "SGVsbG8gd29ybGQ=",
								receipt: {
									"@context": "https://www.w3.org/ns/activitystreams",
									type: "Create",
									actor: "https://example.org/actor",
									object: "https://example.org/object"
								}
							}
						}
					}
				]
			}
		]
	};

	const removeRoute: IRestRoute<IVerifiableStorageRemoveRequest, INoContentResponse> = {
		operationId: "verifiableStorageRemove",
		summary: "Remove an item from verifiable storage",
		tag: tagsVerifiableStorage[0].name,
		method: "DELETE",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			verifiableStorageRemove(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IVerifiableStorageRemoveRequest>(),
			examples: [
				{
					id: "verifiableStorageRemoveExample",
					request: {
						pathParams: {
							id: "verifiable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	return [createRoute, updateRoute, getRoute, removeRoute];
}

/**
 * Create an Verifiable Storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function verifiableStorageCreate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IVerifiableStorageCreateRequest
): Promise<IVerifiableStorageCreateResponse> {
	Guards.object<IVerifiableStorageCreateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IVerifiableStorageCreateRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.stringBase64(ROUTES_SOURCE, nameof(request.body.data), request.body.data);
	const component = ComponentFactory.get<IVerifiableStorageComponent>(componentName);
	const result = await component.create(
		Converter.base64ToBytes(request.body.data),
		httpRequestContext.userIdentity,
		request.body.namespace
	);
	return {
		statusCode: HttpStatusCode.created,
		headers: {
			[HeaderTypes.Location]: result.id
		},
		body: {
			receipt: result.receipt,
			id: result.id
		}
	};
}

/**
 * UPdate an Verifiable Storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function verifiableStorageUpdate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IVerifiableStorageUpdateRequest
): Promise<IVerifiableStorageUpdateResponse> {
	Guards.object<IVerifiableStorageUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IVerifiableStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object<IVerifiableStorageUpdateRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.stringBase64(ROUTES_SOURCE, nameof(request.body.data), request.body.data);
	const component = ComponentFactory.get<IVerifiableStorageComponent>(componentName);
	const result = await component.update(
		request.pathParams.id,
		Converter.base64ToBytes(request.body.data),
		httpRequestContext.userIdentity
	);
	return {
		body: result
	};
}

/**
 * Get an Verifiable Storage.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function verifiableStorageGet(
	componentName: string,
	request: IVerifiableStorageGetRequest
): Promise<IVerifiableStorageGetResponse> {
	Guards.object<IVerifiableStorageGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IVerifiableStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IVerifiableStorageComponent>(componentName);
	const result = await component.get(request.pathParams.id, request.body);
	const data = result.data ? Converter.bytesToBase64(result.data) : undefined;
	return {
		body: {
			data,
			receipt: result.receipt
		}
	};
}

/**
 * Remove an Verifiable Storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function verifiableStorageRemove(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IVerifiableStorageRemoveRequest
): Promise<INoContentResponse> {
	Guards.object<IVerifiableStorageRemoveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IVerifiableStorageRemoveRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IVerifiableStorageComponent>(componentName);
	await component.remove(request.pathParams.id, httpRequestContext.userIdentity);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

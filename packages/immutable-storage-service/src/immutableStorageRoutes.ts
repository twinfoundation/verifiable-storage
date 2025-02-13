// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IHttpRequestContext,
	INoContentResponse,
	IRestRoute,
	ITag
} from "@twin.org/api-models";
import { ComponentFactory, Converter, Guards } from "@twin.org/core";
import type {
	IImmutableStorageComponent,
	IImmutableStorageStoreRequest,
	IImmutableStorageStoreResponse,
	IImmutableStorageGetRequest,
	IImmutableStorageGetResponse,
	IImmutableStorageRemoveRequest
} from "@twin.org/immutable-storage-models";
import { nameof } from "@twin.org/nameof";
import { HeaderTypes, HttpStatusCode } from "@twin.org/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "immutableStorageRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsImmutableStorage: ITag[] = [
	{
		name: "ImmutableStorage",
		description: "Endpoints which are modelled to access an Immutable Storage."
	}
];

/**
 * The REST routes for ImmutableStorage.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesImmutableStorage(
	baseRouteName: string,
	componentName: string
): IRestRoute[] {
	const storeRoute: IRestRoute<IImmutableStorageStoreRequest, IImmutableStorageStoreResponse> = {
		operationId: "immutableStorageStore",
		summary: "Store an Immutable Storage",
		tag: tagsImmutableStorage[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			immutableStorageStore(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IImmutableStorageStoreRequest>(),
			examples: [
				{
					id: "immutableStorageStoreExample",
					request: {
						body: {
							data: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IImmutableStorageStoreResponse>(),
				examples: [
					{
						id: "immutableStorageStoreResponseExample",
						response: {
							statusCode: HttpStatusCode.created,
							headers: {
								[HeaderTypes.Location]:
									"immutable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
							},
							body: {
								receipt: {
									"@context": "https://www.w3.org/ns/activitystreams",
									type: "Create",
									actor: "https://example.org/actor",
									object: "https://example.org/object"
								},
								id: "immutable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
							}
						}
					}
				]
			}
		]
	};

	const getRoute: IRestRoute<IImmutableStorageGetRequest, IImmutableStorageGetResponse> = {
		operationId: "immutableStorageGet",
		summary: "Get an Immutable Storage",
		tag: tagsImmutableStorage[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) => immutableStorageGet(componentName, request),
		requestType: {
			type: nameof<IImmutableStorageGetRequest>(),
			examples: [
				{
					id: "immutableStorageGetExample",
					request: {
						pathParams: {
							id: "immutable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IImmutableStorageGetResponse>(),
				examples: [
					{
						id: "immutableStorageGetResponseExample",
						response: {
							body: {
								data: "MY-Immutable-Storage",
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

	const removeRoute: IRestRoute<IImmutableStorageRemoveRequest, INoContentResponse> = {
		operationId: "immutableStorageRemove",
		summary: "Remove an Immutable Storage",
		tag: tagsImmutableStorage[0].name,
		method: "DELETE",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			immutableStorageRemove(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IImmutableStorageRemoveRequest>(),
			examples: [
				{
					id: "immutableStorageRemoveExample",
					request: {
						pathParams: {
							id: "immutable:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
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

	return [storeRoute, getRoute, removeRoute];
}

/**
 * Store an Immutable Storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function immutableStorageStore(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IImmutableStorageStoreRequest
): Promise<IImmutableStorageStoreResponse> {
	Guards.object<IImmutableStorageStoreRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IImmutableStorageStoreRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.data), request.body.data);
	const component = ComponentFactory.get<IImmutableStorageComponent>(componentName);
	const result = await component.store(
		request.body.data,
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
 * Get an Immutable Storage.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function immutableStorageGet(
	componentName: string,
	request: IImmutableStorageGetRequest
): Promise<IImmutableStorageGetResponse> {
	Guards.object<IImmutableStorageGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IImmutableStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IImmutableStorageComponent>(componentName);
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
 * Remove an Immutable Storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function immutableStorageRemove(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IImmutableStorageRemoveRequest
): Promise<INoContentResponse> {
	Guards.object<IImmutableStorageRemoveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IImmutableStorageRemoveRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IImmutableStorageComponent>(componentName);
	await component.remove(request.pathParams.id, httpRequestContext.userIdentity);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

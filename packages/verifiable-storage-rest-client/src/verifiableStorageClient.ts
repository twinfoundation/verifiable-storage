// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type { IBaseRestClientConfig, INoContentResponse } from "@twin.org/api-models";
import { Converter, Guards, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { nameof } from "@twin.org/nameof";
import type {
	IVerifiableStorageRemoveRequest,
	IVerifiableStorageComponent,
	IVerifiableStorageCreateRequest,
	IVerifiableStorageCreateResponse,
	IVerifiableStorageGetRequest,
	IVerifiableStorageGetResponse,
	IVerifiableStorageUpdateRequest,
	IVerifiableStorageUpdateResponse
} from "@twin.org/verifiable-storage-models";

/**
 * Client for performing Verifiable Storage through to REST endpoints.
 */
export class VerifiableStorageClient extends BaseRestClient implements IVerifiableStorageComponent {
	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<VerifiableStorageClient>();

	/**
	 * Create a new instance of VerifiableStorageClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(nameof<VerifiableStorageClient>(), config, "verifiable");
	}

	/**
	 * Create an Verifiable Storage.
	 * @param data The data of the Verifiable Storage.
	 * @returns The id of the created Verifiable Storage in urn format.
	 */
	public async create(data: Uint8Array): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		const response = await this.fetch<
			IVerifiableStorageCreateRequest,
			IVerifiableStorageCreateResponse
		>("/", "POST", {
			body: {
				data: Converter.bytesToBase64(data)
			}
		});

		return response.body;
	}

	/**
	 * Update an item in verifiable storage.
	 * @param id The id of the item to update.
	 * @param data The data to store.
	 * @returns The updated receipt.
	 */
	public async update(id: string, data: Uint8Array): Promise<IJsonLdNodeObject> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		const response = await this.fetch<
			IVerifiableStorageUpdateRequest,
			IVerifiableStorageUpdateResponse
		>("/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				data: Converter.bytesToBase64(data)
			}
		});

		return response.body;
	}

	/**
	 * Get an Verifiable Storage.
	 * @param id The id of the Verifiable Storage to get.
	 * @param options Additional options for getting the Verifiable Storage.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @returns The data for the Verifiable Storage.
	 */
	public async get(
		id: string,
		options?: { includeData: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IVerifiableStorageGetRequest, IVerifiableStorageGetResponse>(
			"/:id",
			"GET",
			{
				pathParams: {
					id
				},
				body: options
			}
		);

		const data = response.body.data ? Converter.base64ToBytes(response.body.data) : undefined;

		return {
			data,
			receipt: response.body.receipt
		};
	}

	/**
	 * Remove an Verifiable Storage.
	 * @param id The id of the Verifiable Storage to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(id: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IVerifiableStorageRemoveRequest, INoContentResponse>("/:id", "DELETE", {
			pathParams: {
				id
			}
		});
	}
}

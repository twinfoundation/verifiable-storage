// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { nameof } from "@twin.org/nameof";
import {
	VerifiableStorageConnectorFactory,
	type IVerifiableStorageComponent,
	type IVerifiableStorageConnector
} from "@twin.org/verifiable-storage-models";
import type { IVerifiableStorageServiceConstructorOptions } from "./models/IVerifiableStorageServiceConstructorOptions";

/**
 * Service for performing Verifiable Storage operations to a connector.
 */
export class VerifiableStorageService implements IVerifiableStorageComponent {
	/**
	 * The namespace supported by the verifiableStorage service.
	 */
	public static readonly NAMESPACE: string = "verifiable";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<VerifiableStorageService>();

	/**
	 * The default namespace for the connector to use.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * Create a new instance of VerifiableStorageService.
	 * @param options The options for the service.
	 */
	constructor(options?: IVerifiableStorageServiceConstructorOptions) {
		const names = VerifiableStorageConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(this.CLASS_NAME, "noConnectors");
		}

		this._defaultNamespace = options?.config?.defaultNamespace ?? names[0];
	}

	/**
	 * Create a verifiable storage item.
	 * @param data The data for the verifiable storage item.
	 * @param allowList The list of identities that are allowed to modify the item.
	 * @param options Additional options for creating the item.
	 * @param options.maxAllowListSize The maximum size of the allow list.
	 * @param identity The identity to store the Verifiable Storage operation on.
	 * @param namespace The namespace to use for the Verifiable Storage.
	 * @returns The id of the created verifiable storage item.
	 */
	public async create(
		data: Uint8Array,
		allowList?: string[],
		options?: {
			maxAllowListSize?: number;
		},
		identity?: string,
		namespace?: string
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const connectorNamespace = namespace ?? this._defaultNamespace;

			const verifiableStorageConnector =
				VerifiableStorageConnectorFactory.get<IVerifiableStorageConnector>(connectorNamespace);

			const verifiableStorageResult = await verifiableStorageConnector.create(
				identity,
				data,
				allowList,
				options
			);

			return verifiableStorageResult;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "createFailed", undefined, error);
		}
	}

	/**
	 * Update an item in verifiable storage.
	 * @param id The id of the item to update.
	 * @param data The data to store, optional if updating the allow list.
	 * @param allowList Updated list of identities that are allowed to modify the item.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The updated receipt.
	 */
	public async update(
		id: string,
		data?: Uint8Array,
		allowList?: string[],
		identity?: string
	): Promise<IJsonLdNodeObject> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const verifiableStorageConnector = this.getConnector(id);
			const verifiableStorageResult = await verifiableStorageConnector.update(
				identity,
				id,
				data,
				allowList
			);

			return verifiableStorageResult;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "updateFailed", undefined, error);
		}
	}

	/**
	 * Get an Verifiable Storage.
	 * @param id The id of the verifiable storage item to get.
	 * @param options Additional options for getting the verifiable storage item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @param options.includeAllowList Should the allow list be included in the response, defaults to true.
	 * @returns The data for the verifiable storage item.
	 */
	public async get(
		id: string,
		options?: { includeData?: boolean; includeAllowList?: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const verifiableStorageConnector = this.getConnector(id);
			return verifiableStorageConnector.get(id, options);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "getFailed", undefined, error);
		}
	}

	/**
	 * Remove a verifiable storage item.
	 * @param id The id of the Verifiable Storage to remove.
	 * @param identity The identity to perform the verifiableStorage operation on.
	 * @returns Nothing.
	 */
	public async remove(id: string, identity?: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const verifiableStorageConnector = this.getConnector(id);
			await verifiableStorageConnector.remove(identity, id);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removeFailed", undefined, error);
		}
	}

	/**
	 * Get the connector from the uri.
	 * @param id The id of the item in urn format.
	 * @returns The connector.
	 * @internal
	 */
	private getConnector(id: string): IVerifiableStorageConnector {
		const idUri = Urn.fromValidString(id);

		if (idUri.namespaceIdentifier() !== VerifiableStorageService.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: VerifiableStorageService.NAMESPACE,
				id
			});
		}

		return VerifiableStorageConnectorFactory.get<IVerifiableStorageConnector>(
			idUri.namespaceMethod()
		);
	}
}

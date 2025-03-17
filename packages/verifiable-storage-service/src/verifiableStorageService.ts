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
	 * Create an Verifiable Storage.
	 * @param data The data of the Verifiable Storage.
	 * @param identity The identity to store the Verifiable Storage operation on.
	 * @param namespace The namespace to use for the Verifiable Storage.
	 * @returns The id of the created Verifiable Storage in urn format.
	 */
	public async create(
		data: Uint8Array,
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

			const verifiableStorageResult = await verifiableStorageConnector.create(identity, data);

			return verifiableStorageResult;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "createFailed", undefined, error);
		}
	}

	/**
	 * Update an item in verifiable storage.
	 * @param id The id of the item to update.
	 * @param data The data to store.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The updated receipt.
	 */
	public async update(id: string, data: Uint8Array, identity?: string): Promise<IJsonLdNodeObject> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const verifiableStorageConnector = this.getConnector(id);
			const verifiableStorageResult = await verifiableStorageConnector.update(identity, id, data);

			return verifiableStorageResult;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "updateFailed", undefined, error);
		}
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
		options?: { includeData?: boolean }
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
	 * Remove an Verifiable Storage.
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

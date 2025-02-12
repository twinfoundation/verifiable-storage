// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import {
	ImmutableStorageConnectorFactory,
	type IImmutableStorageComponent,
	type IImmutableStorageConnector
} from "@twin.org/immutable-storage-models";
import { nameof } from "@twin.org/nameof";
import type { IImmutableStorageServiceConstructorOptions } from "./models/IImmutableStorageServiceConstructorOptions";

/**
 * Service for performing Immutable Storage operations to a connector.
 */
export class ImmutableStorageService implements IImmutableStorageComponent {
	/**
	 * The namespace supported by the immutableStorage service.
	 */
	public static readonly NAMESPACE: string = "immutable";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<ImmutableStorageService>();

	/**
	 * The default namespace for the connector to use.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * Create a new instance of ImmutableStorageService.
	 * @param options The options for the service.
	 */
	constructor(options?: IImmutableStorageServiceConstructorOptions) {
		const names = ImmutableStorageConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(this.CLASS_NAME, "noConnectors");
		}

		this._defaultNamespace = options?.config?.defaultNamespace ?? names[0];
	}

	/**
	 * Store an Immutable Storage.
	 * @param data The data of the Immutable Storage.
	 * @param identity The identity to store the Immutable Storage operation on.
	 * @returns The id of the created Immutable Storage in urn format.
	 */
	public async store(
		data: Uint8Array,
		identity?: string
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const connectorNamespace = this._defaultNamespace;

			const immutableStorageConnector =
				ImmutableStorageConnectorFactory.get<IImmutableStorageConnector>(connectorNamespace);

			const immutableStorageResult = await immutableStorageConnector.store(identity, data);

			return immutableStorageResult;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "storeFailed", undefined, error);
		}
	}

	/**
	 * Get an Immutable Storage.
	 * @param id The id of the Immutable Storage to get.
	 * @param options Additional options for getting the Immutable Storage.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @returns The data for the Immutable Storage.
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
			const immutableStorageConnector = this.getConnector(id);
			return immutableStorageConnector.get(id, options);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "getFailed", undefined, error);
		}
	}

	/**
	 * Remove an Immutable Storage.
	 * @param id The id of the Immutable Storage to remove.
	 * @param identity The identity to perform the immutableStorage operation on.
	 * @returns Nothing.
	 */
	public async remove(id: string, identity?: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const immutableStorageConnector = this.getConnector(id);
			await immutableStorageConnector.remove(identity, id);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removeFailed", undefined, error);
		}
	}

	/**
	 * Get the connector from the uri.
	 * @param id The id of the Immutable Storage in urn format.
	 * @returns The connector.
	 * @internal
	 */
	private getConnector(id: string): IImmutableStorageConnector {
		const idUri = Urn.fromValidString(id);

		if (idUri.namespaceIdentifier() !== ImmutableStorageService.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: ImmutableStorageService.NAMESPACE,
				id
			});
		}

		return ImmutableStorageConnectorFactory.get<IImmutableStorageConnector>(
			idUri.namespaceMethod()
		);
	}
}

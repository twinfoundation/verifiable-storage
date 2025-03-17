// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	Converter,
	GeneralError,
	Guards,
	Is,
	NotFoundError,
	RandomHelper,
	Urn
} from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	VerifiableStorageContexts,
	type IVerifiableStorageConnector
} from "@twin.org/verifiable-storage-models";
import type { VerifiableItem } from "./entities/verifiableItem";
import { EntityStorageVerifiableStorageTypes } from "./models/entityStorageVerifiableStorageTypes";
import type { IEntityStorageVerifiableStorageConnectorConstructorOptions } from "./models/IEntityStorageVerifiableStorageConnectorConstructorOptions";
import type { IVerifiableStorageEntityStorageReceipt } from "./models/IVerifiableStorageEntityStorageReceipt";

/**
 * Class for performing verifiable storage operations on entity storage.
 */
export class EntityStorageVerifiableStorageConnector implements IVerifiableStorageConnector {
	/**
	 * The namespace supported by the verifiable storage connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<EntityStorageVerifiableStorageConnector>();

	/**
	 * The entity storage for verifiable items.
	 * @internal
	 */
	private readonly _verifiableStorageEntityStorage: IEntityStorageConnector<VerifiableItem>;

	/**
	 * Create a new instance of EntityStorageVerifiableStorageConnector.
	 * @param options The options for the class.
	 */
	constructor(options?: IEntityStorageVerifiableStorageConnectorConstructorOptions) {
		this._verifiableStorageEntityStorage = EntityStorageConnectorFactory.get(
			options?.verifiableStorageEntityStorageType ?? "verifiable-item"
		);
	}

	/**
	 * Create an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored verifiable item in urn format.
	 */
	public async create(
		controller: string,
		data: Uint8Array
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			const itemId = Converter.bytesToHex(RandomHelper.generate(32));

			const verifiableItem: VerifiableItem = {
				id: itemId,
				controller,
				data: Converter.bytesToBase64(data)
			};

			await this._verifiableStorageEntityStorage.set(verifiableItem);

			const receipt: IVerifiableStorageEntityStorageReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: EntityStorageVerifiableStorageTypes.EntityStorageReceipt,
				entityStorageId: itemId
			};

			return {
				id: `verifiable:${new Urn(EntityStorageVerifiableStorageConnector.NAMESPACE, itemId).toString()}`,
				receipt: receipt as unknown as IJsonLdNodeObject
			};
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "creatingFailed", undefined, error);
		}
	}

	/**
	 * Update an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the item to update.
	 * @param data The data to store.
	 * @returns The updated receipt.
	 */
	public async update(
		controller: string,
		id: string,
		data: Uint8Array
	): Promise<IJsonLdNodeObject> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== EntityStorageVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const itemId = urnParsed.namespaceSpecific(1);
			const verifiableItem = await this._verifiableStorageEntityStorage.get(itemId);

			if (Is.empty(verifiableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "verifiableStorageNotFound");
			}

			verifiableItem.data = Converter.bytesToBase64(data);
			await this._verifiableStorageEntityStorage.set(verifiableItem);

			const receipt: IVerifiableStorageEntityStorageReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: EntityStorageVerifiableStorageTypes.EntityStorageReceipt,
				entityStorageId: itemId
			};

			return receipt as unknown as IJsonLdNodeObject;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "updatingFailed", undefined, error);
		}
	}

	/**
	 * Get a verifiable item.
	 * @param id The id of the item to get.
	 * @param options Additional options for getting the item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @returns The data for the item and the receipt.
	 */
	public async get(
		id: string,
		options?: { includeData?: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== EntityStorageVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const itemId = urnParsed.namespaceSpecific(1);
			const verifiableItem = await this._verifiableStorageEntityStorage.get(itemId);

			if (Is.empty(verifiableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "verifiableStorageNotFound");
			}

			const receipt: IVerifiableStorageEntityStorageReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: EntityStorageVerifiableStorageTypes.EntityStorageReceipt,
				entityStorageId: itemId
			};

			return {
				receipt: receipt as unknown as IJsonLdNodeObject,
				data:
					(options?.includeData ?? true) ? Converter.base64ToBytes(verifiableItem.data) : undefined
			};
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "gettingFailed", undefined, error);
		}
	}

	/**
	 * Remove the item from verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the verifiable item to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== EntityStorageVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const itemId = urnParsed.namespaceSpecific(1);
			const verifiableItem = await this._verifiableStorageEntityStorage.get(itemId);

			if (Is.empty(verifiableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "verifiableStorageNotFound");
			}

			if (verifiableItem.controller !== controller) {
				throw new GeneralError(this.CLASS_NAME, "notControllerRemove");
			}

			await this._verifiableStorageEntityStorage.remove(itemId);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removingFailed", undefined, error);
		}
	}
}

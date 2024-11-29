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
import {
	ImmutableStorageTypes,
	type IImmutableStorageConnector
} from "@twin.org/immutable-storage-models";
import { nameof } from "@twin.org/nameof";
import type { ImmutableItem } from "./entities/immutableItem";
import { EntityStorageImmutableStorageTypes } from "./models/entityStorageImmutableStorageTypes";
import type { IImmutableStorageEntityStorageReceipt } from "./models/IImmutableStorageEntityStorageReceipt";

/**
 * Class for performing immutable storage operations on entity storage.
 */
export class EntityStorageImmutableStorageConnector implements IImmutableStorageConnector {
	/**
	 * The namespace supported by the immutable storage connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<EntityStorageImmutableStorageConnector>();

	/**
	 * The entity storage for immutable items.
	 * @internal
	 */
	private readonly _immutableStorageEntityStorage: IEntityStorageConnector<ImmutableItem>;

	/**
	 * Create a new instance of EntityStorageImmutableStorageConnector.
	 * @param options The dependencies for the class.
	 * @param options.immutableStorageEntityStorageType The entity storage for immutable storage items, defaults to "immutable-item".
	 */
	constructor(options?: { immutableStorageEntityStorageType?: string }) {
		this._immutableStorageEntityStorage = EntityStorageConnectorFactory.get(
			options?.immutableStorageEntityStorageType ?? "immutable-item"
		);
	}

	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in urn format.
	 */
	public async store(
		controller: string,
		data: Uint8Array
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			const immutableItemId = Converter.bytesToHex(RandomHelper.generate(32));

			const immutableItem: ImmutableItem = {
				id: immutableItemId,
				controller,
				data: Converter.bytesToBase64(data)
			};

			await this._immutableStorageEntityStorage.set(immutableItem);

			const receipt: IImmutableStorageEntityStorageReceipt = {
				"@context": ImmutableStorageTypes.ContextRoot,
				type: EntityStorageImmutableStorageTypes.EntityStorageReceipt,
				entityStorageId: immutableItemId
			};

			return {
				id: `immutable:${new Urn(EntityStorageImmutableStorageConnector.NAMESPACE, immutableItemId).toString()}`,
				receipt: receipt as unknown as IJsonLdNodeObject
			};
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "storingFailed", undefined, error);
		}
	}

	/**
	 * Get an immutable item.
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

		if (urnParsed.namespaceMethod() !== EntityStorageImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const immutableItemId = urnParsed.namespaceSpecific(1);
			const immutableItem = await this._immutableStorageEntityStorage.get(immutableItemId);

			if (Is.empty(immutableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "immutableStorageNotFound");
			}

			const receipt: IImmutableStorageEntityStorageReceipt = {
				"@context": ImmutableStorageTypes.ContextRoot,
				type: EntityStorageImmutableStorageTypes.EntityStorageReceipt,
				entityStorageId: immutableItemId
			};

			return {
				receipt: receipt as unknown as IJsonLdNodeObject,
				data:
					(options?.includeData ?? true) ? Converter.base64ToBytes(immutableItem.data) : undefined
			};
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "gettingFailed", undefined, error);
		}
	}

	/**
	 * Remove the item from immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the immutable item to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== EntityStorageImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const immutableItemId = urnParsed.namespaceSpecific(1);
			const immutableItem = await this._immutableStorageEntityStorage.get(immutableItemId);

			if (Is.empty(immutableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "immutableStorageNotFound");
			}

			if (immutableItem.controller !== controller) {
				throw new GeneralError(this.CLASS_NAME, "notControllerRemove");
			}

			await this._immutableStorageEntityStorage.remove(immutableItemId);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removingFailed", undefined, error);
		}
	}
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Interface describing a verifiable storage connector.
 */
export interface IVerifiableStorageConnector extends IComponent {
	/**
	 * Create an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @param allowList The list of identities that are allowed to modify the item.
	 * @returns The id of the stored verifiable item in urn format and the receipt.
	 */
	create(
		controller: string,
		data: Uint8Array,
		allowList?: string[]
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}>;

	/**
	 * Update an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the item to update.
	 * @param data The data to store, optional if updating the allow list.
	 * @param allowList Updated list of identities that are allowed to modify the item.
	 * @returns The updated receipt.
	 */
	update(
		controller: string,
		id: string,
		data?: Uint8Array,
		allowList?: string[]
	): Promise<IJsonLdNodeObject>;

	/**
	 * Get an verifiable item.
	 * @param id The id of the item to get.
	 * @param options Additional options for getting the item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @param options.includeAllowList Should the allow list be included in the response, defaults to true.
	 * @returns The data for the item, the receipt and the allowlist.
	 */
	get(
		id: string,
		options?: { includeData?: boolean; includeAllowList?: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
		allowList?: string[];
	}>;

	/**
	 * Remove the item from verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the verifiable item to remove in urn format.
	 * @returns Nothing.
	 */
	remove(controller: string, id: string): Promise<void>;
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Interface describing an immutable storage connector.
 */
export interface IImmutableStorageConnector extends IComponent {
	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in urn format and the receipt.
	 */
	store(
		controller: string,
		data: Uint8Array
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}>;

	/**
	 * Get an immutable item.
	 * @param id The id of the item to get.
	 * @param options Additional options for getting the item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @returns The data for the item and the receipt.
	 */
	get(
		id: string,
		options?: { includeData?: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
	}>;

	/**
	 * Remove the item from immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the immutable item to remove in urn format.
	 * @returns Nothing.
	 */
	remove(controller: string, id: string): Promise<void>;
}

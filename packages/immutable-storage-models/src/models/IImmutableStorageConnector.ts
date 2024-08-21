// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@gtsc/core";

/**
 * Interface describing an immutable storage connector.
 */
export interface IImmutableStorageConnector extends IComponent {
	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in urn format.
	 */
	store(controller: string, data: Uint8Array): Promise<string>;

	/**
	 * Get an immutable item.
	 * @param id The id of the item to get.
	 * @returns The data for the item.
	 */
	get(id: string): Promise<Uint8Array>;

	/**
	 * Remove the item from immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the immutable item to remove in urn format.
	 * @returns Nothing.
	 */
	remove(controller: string, id: string): Promise<void>;
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Interface describing a Verifiable Storage component.
 */
export interface IVerifiableStorageComponent extends IComponent {
	/**
	 * Create an item in verifiable storage.
	 * @param data The data to store.
	 * @param allowList The list of identities that are allowed to modify the item.
	 * @param options Additional options for creating the item.
	 * @param options.maxAllowListSize The maximum size of the allow list.
	 * @param identity The identity of the user to access the vault keys.
	 * @param namespace The namespace to store the item in.
	 * @returns The id of the stored verifiable item in urn format and the receipt.
	 */
	create(
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
	}>;

	/**
	 * Update an item in verifiable storage.
	 * @param id The id of the item to update.
	 * @param data The data to store, optional if updating the allow list.
	 * @param allowList Updated list of identities that are allowed to modify the item.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The updated receipt.
	 */
	update(
		id: string,
		data?: Uint8Array,
		allowList?: string[],
		identity?: string
	): Promise<IJsonLdNodeObject>;

	/**
	 * Get an verifiable item.
	 * @param id The id of the item to get.
	 * @param options Additional options for getting the item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @param options.includeAllowList Should the allow list be included in the response, defaults to true.
	 * @returns The data for the item and the receipt.
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
	 * @param id The id of the verifiable item to remove in urn format.
	 * @param controllerIdentity The identity of the controller.
	 * @returns Nothing.
	 */
	remove(id: string, controllerIdentity?: string): Promise<void>;
}

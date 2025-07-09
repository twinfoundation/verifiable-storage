// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Store the data and return the verifiable storage item id.
 */
export interface IVerifiableStorageCreateRequest {
	/**
	 * The data to be stored.
	 */
	body: {
		/**
		 * The data for the verifiable storage item, this is a string serialized as base64.
		 */
		data: string;

		/**
		 * The list of identities that are allowed to modify the item.
		 */
		allowList?: string[];

		/**
		 * The maximum size of the allow list.
		 * @default 100
		 */
		maxAllowListSize?: number;

		/**
		 * The namespace of the connector to use for the verifiable storage item, defaults to component configured namespace.
		 */
		namespace?: string;
	};
}

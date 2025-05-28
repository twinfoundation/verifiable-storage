// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Update the data and return the receipt.
 */
export interface IVerifiableStorageUpdateRequest {
	/**
	 * The data to be updated.
	 */
	pathParams: {
		/**
		 * The id of the verifiable storage item to update.
		 */
		id: string;
	};

	/**
	 * The data to be updated.
	 */
	body: {
		/**
		 * The data which is a string serialized as base64, leave empty if just updating the allow list.
		 */
		data?: string;

		/**
		 * An updated list of identities that are allowed to modify the item, send an empty list to remove all entries.
		 */
		allowList?: string[];
	};
}

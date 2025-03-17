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
		 * The id of the Verifiable Storage to update.
		 */
		id: string;
	};
	/**
	 * The data to be updated.
	 */
	body: {
		/**
		 * The data for the Verifiable Storage, this is a string serialized as base64.
		 */
		data: string;
	};
}

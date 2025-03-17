// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Store the data and return the Verifiable Storage id.
 */
export interface IVerifiableStorageCreateRequest {
	/**
	 * The data to be stored.
	 */
	body: {
		/**
		 * The data for the Verifiable Storage, this is a string serialized as base64.
		 */
		data: string;

		/**
		 * The namespace of the connector to use for the Verifiable Storage, defaults to component configured namespace.
		 */
		namespace?: string;
	};
}

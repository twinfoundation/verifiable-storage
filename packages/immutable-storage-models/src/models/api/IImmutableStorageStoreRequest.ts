// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Store the data and return the Immutable Storage id.
 */
export interface IImmutableStorageStoreRequest {
	/**
	 * The data to be stored.
	 */
	body: {
		/**
		 * The data for the Immutable Storage.
		 */
		data: Uint8Array;
	};
}

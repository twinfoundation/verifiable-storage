// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Get the Immutable Storage.
 */
export interface IImmutableStorageGetRequest {
	/**
	 * The data to be requested.
	 */
	pathParams: {
		/**
		 * The id of the Immutable Storage to resolve.
		 */
		id: string;
	};
	/**
	 * The body optional param.
	 */
	body?: {
		/**
		 * The flag to include the data.
		 */
		includeData: boolean;
	};
}

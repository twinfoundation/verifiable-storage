// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Get the verifiable storage item.
 */
export interface IVerifiableStorageGetRequest {
	/**
	 * The data to be requested.
	 */
	pathParams: {
		/**
		 * The id of the verifiable storage item to resolve.
		 */
		id: string;
	};
	/**
	 * The body optional param.
	 */
	body?: {
		/**
		 * The flag to include the data.
		 * @default true
		 */
		includeData?: boolean;

		/**
		 * The flag to include the allow list.
		 * @default true
		 */
		includeAllowList?: boolean;
	};
}

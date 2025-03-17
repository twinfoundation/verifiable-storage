// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Remove the Verifiable Storage.
 */
export interface IVerifiableStorageRemoveRequest {
	/**
	 * The data to be used for resolving.
	 */
	pathParams: {
		/**
		 * The id of the Verifiable Storage to remove.
		 */
		id: string;
	};
}

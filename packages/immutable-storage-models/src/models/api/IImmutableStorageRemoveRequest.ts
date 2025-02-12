// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Remove the Immutable Storage.
 */
export interface IImmutableStorageRemoveRequest {
	/**
	 * The data to be used for resolving.
	 */
	pathParams: {
		/**
		 * The id of the Immutable Storage to remove.
		 */
		id: string;
	};
}

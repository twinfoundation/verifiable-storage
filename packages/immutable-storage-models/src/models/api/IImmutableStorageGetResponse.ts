// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Response to getting the Immutable Storage.
 */
export interface IImmutableStorageGetResponse {
	/**
	 * The data that was obtained.
	 */
	body: {
		/**
		 * The receipt associated to the Immutable Storage.
		 */
		receipt: IJsonLdNodeObject;

		/**
		 * The data of the Immutable Storage.
		 */
		data?: Uint8Array;
	};
}

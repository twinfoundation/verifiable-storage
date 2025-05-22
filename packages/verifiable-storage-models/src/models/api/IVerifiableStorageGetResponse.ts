// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Response to getting the verifiable storage item.
 */
export interface IVerifiableStorageGetResponse {
	/**
	 * The data that was obtained.
	 */
	body: {
		/**
		 * The receipt associated to the verifiable storage item.
		 */
		receipt: IJsonLdNodeObject;

		/**
		 * The data of the verifiable storage item, this is a string serialized as base64.
		 */
		data?: string;

		/**
		 * The list of identities that are allowed to modify the item.
		 */
		allowList?: string[];
	};
}

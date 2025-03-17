// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Response to getting the Verifiable Storage.
 */
export interface IVerifiableStorageGetResponse {
	/**
	 * The data that was obtained.
	 */
	body: {
		/**
		 * The receipt associated to the Verifiable Storage.
		 */
		receipt: IJsonLdNodeObject;

		/**
		 * The data of the Verifiable Storage, this is a string serialized as base64.
		 */
		data?: string;
	};
}

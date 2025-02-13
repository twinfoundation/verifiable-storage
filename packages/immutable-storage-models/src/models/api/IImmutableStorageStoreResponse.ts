// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ICreatedResponse } from "@twin.org/api-models";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Response to storing the Immutable Storage.
 */
export interface IImmutableStorageStoreResponse extends ICreatedResponse {
	/**
	 * The data that was stored.
	 */
	body: {
		/**
		 * The receipt associated to the Immutable Storage.
		 */
		receipt: IJsonLdNodeObject;

		/**
		 * The id of the Immutable Storage.
		 */
		id: string;
	};
}

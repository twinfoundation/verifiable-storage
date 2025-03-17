// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Response to updating the Verifiable Storage.
 */
export interface IVerifiableStorageUpdateResponse {
	/**
	 * The data that was updated.
	 */
	body: IJsonLdNodeObject;
}

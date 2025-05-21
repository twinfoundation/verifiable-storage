// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@twin.org/entity";

/**
 * Class describing the verifiable item.
 */
@entity()
export class VerifiableItem {
	/**
	 * The id of the item.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The creator of the item.
	 */
	@property({ type: "string" })
	public creator!: string;

	/**
	 * The data base64 encoded.
	 */
	@property({ type: "string" })
	public data!: string;

	/**
	 * The allow list for modifying the data.
	 */
	@property({ type: "array", itemTypeRef: "string" })
	public allowlist!: string[];
}

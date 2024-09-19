// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@twin.org/entity";

/**
 * Class describing the immutable item.
 */
@entity()
export class ImmutableItem {
	/**
	 * The id of the item.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The controller of the immutable item.
	 */
	@property({ type: "string" })
	public controller!: string;

	/**
	 * The immutable data base64 encoded.
	 */
	@property({ type: "string" })
	public data!: string;
}

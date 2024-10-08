// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { EntityStorageImmutableStorageTypes } from "./entityStorageImmutableStorageTypes";

/**
 * Receipt for the entity storage Immutable Storage connector.
 */
export interface IEntityStorageImmutableStorageReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof EntityStorageImmutableStorageTypes.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof EntityStorageImmutableStorageTypes.EntityStorageReceipt;
}

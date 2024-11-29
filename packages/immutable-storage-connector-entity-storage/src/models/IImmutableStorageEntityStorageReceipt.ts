// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ImmutableStorageTypes } from "@twin.org/immutable-storage-models";
import type { EntityStorageImmutableStorageTypes } from "./entityStorageImmutableStorageTypes";

/**
 * Receipt for the entity storage Immutable Storage connector.
 */
export interface IImmutableStorageEntityStorageReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof ImmutableStorageTypes.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof EntityStorageImmutableStorageTypes.EntityStorageReceipt;

	/**
	 * The entity storage Id.
	 */
	entityStorageId: string;
}

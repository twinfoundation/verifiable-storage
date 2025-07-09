// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { VerifiableStorageContexts } from "@twin.org/verifiable-storage-models";
import type { EntityStorageVerifiableStorageTypes } from "./entityStorageVerifiableStorageTypes";

/**
 * Receipt for the entity storage Verifiable Storage connector.
 */
export interface IVerifiableStorageEntityStorageReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof VerifiableStorageContexts.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof EntityStorageVerifiableStorageTypes.EntityStorageReceipt;

	/**
	 * The entity storage Id.
	 */
	entityStorageId: string;
}

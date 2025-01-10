// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ImmutableStorageTypes } from "@twin.org/immutable-storage-models";
import type { IotaRebasedImmutableStorageTypes } from "./iotaRebasedImmutableStorageTypes";

/**
 * Receipt for the IOTA Rebased Immutable Storage connector.
 */
export interface IImmutableStorageIotaRebasedReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof ImmutableStorageTypes.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof IotaRebasedImmutableStorageTypes.IotaRebasedReceipt;
}

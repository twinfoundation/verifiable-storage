// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ImmutableStorageContexts } from "@twin.org/immutable-storage-models";
import type { IotaImmutableStorageTypes } from "./iotaImmutableStorageTypes";

/**
 * Receipt for the IOTA Immutable Storage connector.
 */
export interface IImmutableStorageIotaReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof ImmutableStorageContexts.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof IotaImmutableStorageTypes.IotaReceipt;
}

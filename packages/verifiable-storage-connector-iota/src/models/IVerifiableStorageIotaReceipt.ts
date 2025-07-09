// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { VerifiableStorageContexts } from "@twin.org/verifiable-storage-models";
import type { IotaVerifiableStorageTypes } from "./iotaVerifiableStorageTypes";

/**
 * Receipt for the IOTA Verifiable Storage connector.
 */
export interface IVerifiableStorageIotaReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof VerifiableStorageContexts.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof IotaVerifiableStorageTypes.IotaReceipt;

	/**
	 * The epoch of the transaction.
	 */
	epoch: string;

	/**
	 * The digest of the transaction.
	 */
	digest: string;
}

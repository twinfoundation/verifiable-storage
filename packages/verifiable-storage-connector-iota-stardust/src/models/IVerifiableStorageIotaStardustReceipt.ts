// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { VerifiableStorageContexts } from "@twin.org/verifiable-storage-models";
import type { IotaStardustVerifiableStorageTypes } from "./iotaStardustVerifiableStorageTypes";

/**
 * Receipt for the IOTA Verifiable Storage connector.
 */
export interface IVerifiableStorageIotaStardustReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof VerifiableStorageContexts.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof IotaStardustVerifiableStorageTypes.IotaReceipt;

	/**
	 * The index of the milestone that the item was booked in to the ledger.
	 */
	milestoneIndexBooked: number;

	/**
	 * The timestamp of the milestone that the item was booked in to the ledger.
	 */
	milestoneTimestampBooked: number;

	/**
	 * The network for the receipt.
	 */
	network: string;

	/**
	 * The alias for the receipt.
	 */
	aliasId: string;
}

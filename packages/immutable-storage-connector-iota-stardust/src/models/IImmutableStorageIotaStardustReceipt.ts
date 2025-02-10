// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { ImmutableStorageTypes } from "@twin.org/immutable-storage-models";
import type { IotaStardustImmutableStorageTypes } from "./iotaStardustImmutableStorageTypes";

/**
 * Receipt for the IOTA Immutable Storage connector.
 */
export interface IImmutableStorageIotaStardustReceipt {
	/**
	 * JSON-LD Context.
	 */
	"@context": typeof ImmutableStorageTypes.ContextRoot;

	/**
	 * JSON-LD Type.
	 */
	type: typeof IotaStardustImmutableStorageTypes.IotaReceipt;

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
	 * The transaction for the receipt.
	 */
	transactionId: string;
}

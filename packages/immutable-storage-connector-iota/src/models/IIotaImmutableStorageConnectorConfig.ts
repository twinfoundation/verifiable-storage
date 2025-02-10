// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig } from "@twin.org/dlt-iota";

/**
 * Configuration interface for IOTA ImmutableStorageConnector.
 */
export interface IIotaImmutableStorageConnectorConfig extends IIotaConfig {
	/**
	 * The name of the contract to use.
	 * @default "immutable-storage"
	 */
	contractName?: string;

	/**
	 * The gas budget to use for transactions.
	 * @default 1_000_000_000
	 */
	gasBudget?: number;

	/**
	 * The wallet address index to use when deriving addresses.
	 * @default 0
	 */
	walletAddressIndex?: number;

	/**
	 * The package controller address index to use when creating package.
	 * @default 0
	 */
	packageControllerAddressIndex?: number;

	/**
	 * Enable cost logging.
	 * @default false
	 */
	enableCostLogging?: boolean;
}

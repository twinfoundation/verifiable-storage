// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig } from "@gtsc/dlt-iota";

/**
 * Configuration for the IOTA Immutable Storage connector.
 */
export interface IIotaImmutableStorageConnectorConfig extends IIotaConfig {
	/**
	 * The wallet address index to use to return fees for removed immutable items.
	 * @default 0
	 */
	walletAddressIndex?: number;
}

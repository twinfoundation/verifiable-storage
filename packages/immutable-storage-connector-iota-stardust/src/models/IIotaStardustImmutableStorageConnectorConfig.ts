// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustConfig } from "@twin.org/dlt-iota-stardust";

/**
 * Configuration for the IOTA Immutable Storage connector.
 */
export interface IIotaStardustImmutableStorageConnectorConfig extends IIotaStardustConfig {
	/**
	 * The wallet address index to use to return fees for removed immutable items.
	 * @default 0
	 */
	walletAddressIndex?: number;
}

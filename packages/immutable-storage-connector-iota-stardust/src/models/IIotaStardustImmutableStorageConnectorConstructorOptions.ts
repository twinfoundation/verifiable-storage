// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustImmutableStorageConnectorConfig } from "./IIotaStardustImmutableStorageConnectorConfig";

/**
 * Options for the IOTA Stardust Immutable Storage connector.
 */
export interface IIotaStardustImmutableStorageConnectorConstructorOptions {
	/**
	 * The type of the vault connector.
	 * @default vault
	 */
	vaultConnectorType?: string;

	/**
	 * The configuration for the connector.
	 */
	config: IIotaStardustImmutableStorageConnectorConfig;
}

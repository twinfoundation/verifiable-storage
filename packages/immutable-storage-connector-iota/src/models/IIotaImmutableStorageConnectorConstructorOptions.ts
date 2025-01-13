// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaImmutableStorageConnectorConfig } from "./IIotaImmutableStorageConnectorConfig";

/**
 * Options for the IOTA Immutable Storage connector.
 */
export interface IIotaImmutableStorageConnectorConstructorOptions {
	/**
	 * The type of the vault connector.
	 * @default vault
	 */
	vaultConnectorType?: string;

	/**
	 * The configuration for the connector.
	 */
	config: IIotaImmutableStorageConnectorConfig;
}

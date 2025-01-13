// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaRebasedImmutableStorageConnectorConfig } from "./IIotaRebasedImmutableStorageConnectorConfig";

/**
 * Options for the IotaRebasedImmutableStorageConnector.
 */
export interface IIotaRebasedImmutableStorageConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaRebasedImmutableStorageConnectorConfig;

	/**
	 * The vault connector type to use.
	 * @default "vault"
	 */
	vaultConnectorType?: string;
}

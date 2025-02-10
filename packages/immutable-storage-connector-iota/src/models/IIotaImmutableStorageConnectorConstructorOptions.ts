// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaImmutableStorageConnectorConfig } from "./IIotaImmutableStorageConnectorConfig";

/**
 * Options for the IotaImmutableStorageConnector.
 */
export interface IIotaImmutableStorageConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaImmutableStorageConnectorConfig;

	/**
	 * The vault connector type to use.
	 * @default "vault"
	 */
	vaultConnectorType?: string;

	/**
	 * The logging connector type.
	 * @default logging
	 */
	loggingConnectorType?: string;
}

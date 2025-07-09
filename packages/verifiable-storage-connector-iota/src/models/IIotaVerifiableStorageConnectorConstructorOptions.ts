// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaVerifiableStorageConnectorConfig } from "./IIotaVerifiableStorageConnectorConfig";

/**
 * Options for the IotaVerifiableStorageConnector.
 */
export interface IIotaVerifiableStorageConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaVerifiableStorageConnectorConfig;

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

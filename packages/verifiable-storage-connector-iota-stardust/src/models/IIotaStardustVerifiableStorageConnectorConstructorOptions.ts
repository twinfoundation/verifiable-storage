// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustVerifiableStorageConnectorConfig } from "./IIotaStardustVerifiableStorageConnectorConfig";

/**
 * Options for the IOTA Stardust Verifiable Storage connector.
 */
export interface IIotaStardustVerifiableStorageConnectorConstructorOptions {
	/**
	 * The type of the vault connector.
	 * @default vault
	 */
	vaultConnectorType?: string;

	/**
	 * The configuration for the connector.
	 */
	config: IIotaStardustVerifiableStorageConnectorConfig;
}

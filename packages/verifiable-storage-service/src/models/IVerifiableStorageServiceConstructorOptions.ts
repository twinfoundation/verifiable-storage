// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IVerifiableStorageServiceConfig } from "./IVerifiableStorageServiceConfig";

/**
 * Options for the Verifiable Storage service constructor.
 */
export interface IVerifiableStorageServiceConstructorOptions {
	/**
	 * The configuration for the service.
	 */
	config?: IVerifiableStorageServiceConfig;
}

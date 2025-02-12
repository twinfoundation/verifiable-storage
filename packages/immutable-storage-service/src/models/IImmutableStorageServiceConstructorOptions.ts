// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IImmutableStorageServiceConfig } from "./IImmutableStorageServiceConfig";

/**
 * Options for the Immutable Storage service constructor.
 */
export interface IImmutableStorageServiceConstructorOptions {
	/**
	 * The configuration for the service.
	 */
	config?: IImmutableStorageServiceConfig;
}

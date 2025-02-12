// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Immutable Storage Service.
 */
export interface IImmutableStorageServiceConfig {
	/**
	 * What is the default connector to use for Immutable Storage. If not provided the first connector from the factory will be used.
	 */
	defaultNamespace?: string;
}

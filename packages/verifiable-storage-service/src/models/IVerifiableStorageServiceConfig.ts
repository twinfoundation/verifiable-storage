// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Verifiable Storage Service.
 */
export interface IVerifiableStorageServiceConfig {
	/**
	 * What is the default connector to use for Verifiable Storage. If not provided the first connector from the factory will be used.
	 */
	defaultNamespace?: string;
}

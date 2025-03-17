// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Options for the entity storage verifiable storage connector.
 */
export interface IEntityStorageVerifiableStorageConnectorConstructorOptions {
	/**
	 * The entity storage for verifiable storage items.
	 * @default verifiable-item
	 */
	verifiableStorageEntityStorageType?: string;
}

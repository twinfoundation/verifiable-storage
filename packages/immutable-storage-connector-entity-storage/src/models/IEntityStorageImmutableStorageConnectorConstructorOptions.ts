// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Options for the entity storage immutable storage connector.
 */
export interface IEntityStorageImmutableStorageConnectorConstructorOptions {
	/**
	 * The entity storage for immutable storage items.
	 * @default immutable-item
	 */
	immutableStorageEntityStorageType?: string;
}

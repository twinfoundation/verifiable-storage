// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of entity storage immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const EntityStorageImmutableStorageTypes = {
	/**
	 * Represents entity storage receipt.
	 */
	EntityStorageReceipt: "ImmutableStorageEntityStorageReceipt"
} as const;

/**
 * The types of entity storage immutable storage data.
 */
export type EntityStorageImmutableStorageTypes =
	(typeof EntityStorageImmutableStorageTypes)[keyof typeof EntityStorageImmutableStorageTypes];

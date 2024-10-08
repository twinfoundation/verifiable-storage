// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of IOTA immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const IotaImmutableStorageTypes = {
	/**
	 * Represents IOTA receipt.
	 */
	IotaReceipt: "ImmutableStorageIotaReceipt"
} as const;

/**
 * The types of IOTA immutable storage data.
 */
export type IotaImmutableStorageTypes =
	(typeof IotaImmutableStorageTypes)[keyof typeof IotaImmutableStorageTypes];

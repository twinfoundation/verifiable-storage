// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of IOTA Stardust immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const IotaStardustImmutableStorageTypes = {
	/**
	 * Represents IOTA Stardust receipt.
	 */
	IotaReceipt: "ImmutableStorageIotaStardustReceipt"
} as const;

/**
 * The types of IOTA immutable storage data.
 */
export type IotaStardustImmutableStorageTypes =
	(typeof IotaStardustImmutableStorageTypes)[keyof typeof IotaStardustImmutableStorageTypes];

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of IOTA Rebased immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const IotaRebasedImmutableStorageTypes = {
	/**
	 * Represents IOTA Rebased receipt.
	 */
	IotaRebasedReceipt: "ImmutableStorageIotaRebasedReceipt"
} as const;

/**
 * The types of IOTA Rebased immutable storage data.
 */
export type IotaRebasedImmutableStorageTypes =
	(typeof IotaRebasedImmutableStorageTypes)[keyof typeof IotaRebasedImmutableStorageTypes];

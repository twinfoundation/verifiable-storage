// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of IOTA immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const IotaImmutableStorageTypes = {
	/**
	 * The context root for the immutable storage types.
	 */
	ContextRoot: "https://schema.twindev.org/immutable-storage/",

	/**
	 * Represents IOTA receipt.
	 */
	IotaReceipt: "IotaReceipt"
} as const;

/**
 * The types of IOTA immutable storage data.
 */
export type IotaImmutableStorageTypes =
	(typeof IotaImmutableStorageTypes)[keyof typeof IotaImmutableStorageTypes];

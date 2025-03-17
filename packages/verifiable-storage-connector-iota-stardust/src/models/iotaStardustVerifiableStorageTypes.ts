// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of IOTA Stardust verifiable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const IotaStardustVerifiableStorageTypes = {
	/**
	 * Represents IOTA Stardust receipt.
	 */
	IotaReceipt: "VerifiableStorageIotaStardustReceipt"
} as const;

/**
 * The types of IOTA Stardust verifiable storage data.
 */
export type IotaStardustVerifiableStorageTypes =
	(typeof IotaStardustVerifiableStorageTypes)[keyof typeof IotaStardustVerifiableStorageTypes];

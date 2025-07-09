// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of IOTA verifiable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const IotaVerifiableStorageTypes = {
	/**
	 * Represents IOTA receipt.
	 */
	IotaReceipt: "VerifiableStorageIotaReceipt"
} as const;

/**
 * The types of IOTA verifiable storage data.
 */
export type IotaVerifiableStorageTypes =
	(typeof IotaVerifiableStorageTypes)[keyof typeof IotaVerifiableStorageTypes];

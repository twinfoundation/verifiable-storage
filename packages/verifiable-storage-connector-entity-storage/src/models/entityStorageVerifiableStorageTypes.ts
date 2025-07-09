// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of entity storage verifiable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const EntityStorageVerifiableStorageTypes = {
	/**
	 * Represents entity storage receipt.
	 */
	EntityStorageReceipt: "VerifiableStorageEntityStorageReceipt"
} as const;

/**
 * The types of entity storage verifiable storage data.
 */
export type EntityStorageVerifiableStorageTypes =
	(typeof EntityStorageVerifiableStorageTypes)[keyof typeof EntityStorageVerifiableStorageTypes];

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImmutableStorageTypes = {
	/**
	 * The context root for the immutable storage types.
	 */
	ContextRoot: "https://schema.twindev.org/immutable-storage/"
} as const;

/**
 * The types of immutable storage data.
 */
export type ImmutableStorageTypes =
	(typeof ImmutableStorageTypes)[keyof typeof ImmutableStorageTypes];

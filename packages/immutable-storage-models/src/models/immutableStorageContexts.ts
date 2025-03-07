// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The contexts of immutable storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImmutableStorageContexts = {
	/**
	 * The context root for the immutable storage types.
	 */
	ContextRoot: "https://schema.twindev.org/immutable-storage/"
} as const;

/**
 * The contexts of immutable storage data.
 */
export type ImmutableStorageContexts =
	(typeof ImmutableStorageContexts)[keyof typeof ImmutableStorageContexts];

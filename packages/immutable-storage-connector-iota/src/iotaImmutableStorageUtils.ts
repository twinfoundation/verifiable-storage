// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";

/**
 * Utility functions for the iota immutable storage.
 */
export class IotaImmutableStorageUtils {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<IotaImmutableStorageUtils>();

	/**
	 * Convert an immutable storage id to an object id.
	 * @param immutableStorageIdUrn The immutable storage id to convert in urn format.
	 * @returns The object id.
	 * @throws GeneralError if the immutable storage id is invalid.
	 */
	public static immutableStorageIdToObjectId(immutableStorageIdUrn: string): string {
		// The immutableStorageId is made up from immutable-storage:iota:devnet:packageId:objectid
		const immutableStorageUrn = Urn.fromValidString(immutableStorageIdUrn);
		const parts = immutableStorageUrn.parts();
		if (parts.length !== 5) {
			throw new GeneralError(
				IotaImmutableStorageUtils.CLASS_NAME,
				"invalidImmutableStorageIdFormat",
				{
					id: immutableStorageIdUrn
				}
			);
		}
		return parts[4];
	}

	/**
	 * Convert an immutable storage id to a package id.
	 * @param immutableStorageIdUrn The immutable storage id to convert in urn format.
	 * @returns The package id.
	 * @throws GeneralError if the immutable storage id is invalid.
	 */
	public static immutableStorageIdToPackageId(immutableStorageIdUrn: string): string {
		// The immutableStorageId is made up from immutable-storage:iota:devnet:packageId:objectid
		const immutableStorageUrn = Urn.fromValidString(immutableStorageIdUrn);
		const parts = immutableStorageUrn.parts();
		if (parts.length !== 5) {
			throw new GeneralError(
				IotaImmutableStorageUtils.CLASS_NAME,
				"invalidImmutableStorageIdFormat",
				{
					id: immutableStorageIdUrn
				}
			);
		}
		return parts[3];
	}
}

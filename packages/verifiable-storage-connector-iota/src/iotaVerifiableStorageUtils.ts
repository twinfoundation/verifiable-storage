// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";

/**
 * Utility functions for the iota verifiable storage.
 */
export class IotaVerifiableStorageUtils {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<IotaVerifiableStorageUtils>();

	/**
	 * Convert a verifiable storage id to an object id.
	 * @param verifiableStorageIdUrn The verifiable storage id to convert in urn format.
	 * @returns The object id.
	 * @throws GeneralError if the verifiable storage id is invalid.
	 */
	public static verifiableStorageIdToObjectId(verifiableStorageIdUrn: string): string {
		// The verifiableStorageId is made up from verifiable-storage:iota:packageId:objectid
		const verifiableStorageUrn = Urn.fromValidString(verifiableStorageIdUrn);
		const parts = verifiableStorageUrn.parts();
		if (parts.length !== 4) {
			throw new GeneralError(
				IotaVerifiableStorageUtils.CLASS_NAME,
				"invalidVerifiableStorageIdFormat",
				{
					id: verifiableStorageIdUrn
				}
			);
		}
		return parts[3];
	}

	/**
	 * Convert a verifiable storage id to a package id.
	 * @param verifiableStorageIdUrn The verifiable storage id to convert in urn format.
	 * @returns The package id.
	 * @throws GeneralError if the verifiable storage id is invalid.
	 */
	public static verifiableStorageIdToPackageId(verifiableStorageIdUrn: string): string {
		// The verifiableStorageId is made up from verifiable-storage:iota:packageId:objectid
		const verifiableStorageUrn = Urn.fromValidString(verifiableStorageIdUrn);
		const parts = verifiableStorageUrn.parts();
		if (parts.length !== 4) {
			throw new GeneralError(
				IotaVerifiableStorageUtils.CLASS_NAME,
				"invalidVerifiableStorageIdFormat",
				{
					id: verifiableStorageIdUrn
				}
			);
		}
		return parts[2];
	}
}

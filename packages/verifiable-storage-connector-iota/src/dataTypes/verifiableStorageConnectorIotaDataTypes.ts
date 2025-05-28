// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import { VerifiableStorageContexts } from "@twin.org/verifiable-storage-models";
import type { JSONSchema7 } from "json-schema";
import { IotaVerifiableStorageTypes } from "../models/iotaVerifiableStorageTypes";
import VerifiableStorageIotaReceiptSchema from "../schemas/VerifiableStorageIotaReceipt.json";

/**
 * Handle all the data types for verifiable storage connector entity storage.
 */
export class VerifiableStorageConnectorIotaDataTypes {
	/**
	 * Register all the data types.
	 */
	public static registerTypes(): void {
		DataTypeHandlerFactory.register(
			`${VerifiableStorageContexts.ContextRoot}${IotaVerifiableStorageTypes.IotaReceipt}`,
			() => ({
				context: VerifiableStorageContexts.ContextRoot,
				type: IotaVerifiableStorageTypes.IotaReceipt,
				defaultValue: {},
				jsonSchema: async () => VerifiableStorageIotaReceiptSchema as JSONSchema7
			})
		);
	}
}

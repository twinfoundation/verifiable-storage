// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DataTypeHandlerFactory, type IJsonSchema } from "@twin.org/data-core";
import { VerifiableStorageContexts } from "@twin.org/verifiable-storage-models";
import { EntityStorageVerifiableStorageTypes } from "../models/entityStorageVerifiableStorageTypes";
import VerifiableStorageEntityStorageReceiptSchema from "../schemas/VerifiableStorageEntityStorageReceipt.json";

/**
 * Handle all the data types for verifiable storage connector entity storage.
 */
export class VerifiableStorageConnectorEntityStorageDataTypes {
	/**
	 * Register all the data types.
	 */
	public static registerTypes(): void {
		DataTypeHandlerFactory.register(
			`${VerifiableStorageContexts.ContextRoot}${EntityStorageVerifiableStorageTypes.EntityStorageReceipt}`,
			() => ({
				context: VerifiableStorageContexts.ContextRoot,
				type: EntityStorageVerifiableStorageTypes.EntityStorageReceipt,
				defaultValue: {},
				jsonSchema: async () => VerifiableStorageEntityStorageReceiptSchema as IJsonSchema
			})
		);
	}
}

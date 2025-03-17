// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof } from "@twin.org/nameof";
import { VerifiableItem } from "./entities/verifiableItem";

/**
 * Initialize the schema for the verifiable storage entity storage connector.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<VerifiableItem>(), () =>
		EntitySchemaHelper.getSchema(VerifiableItem)
	);
}

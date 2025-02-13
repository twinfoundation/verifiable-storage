// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntityStorageImmutableStorageConnector } from "@twin.org/immutable-storage-connector-entity-storage";
import { ImmutableStorageConnectorFactory } from "@twin.org/immutable-storage-models";
import { describe, test, expect } from "vitest";
import { ImmutableStorageService } from "../src/immutableStorageService";

describe("ImmutableStorageService", () => {
	test("Can create an instance", async () => {
		ImmutableStorageConnectorFactory.register(
			EntityStorageImmutableStorageConnector.NAMESPACE,
			() => new EntityStorageImmutableStorageConnector()
		);
		const service = new ImmutableStorageService();
		expect(service).toBeDefined();
	});
});

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntityStorageVerifiableStorageConnector } from "@twin.org/verifiable-storage-connector-entity-storage";
import { VerifiableStorageConnectorFactory } from "@twin.org/verifiable-storage-models";
import { VerifiableStorageService } from "../src/verifiableStorageService";

describe("VerifiableStorageService", () => {
	test("Can create an instance", async () => {
		VerifiableStorageConnectorFactory.register(
			EntityStorageVerifiableStorageConnector.NAMESPACE,
			() => new EntityStorageVerifiableStorageConnector()
		);
		const service = new VerifiableStorageService();
		expect(service).toBeDefined();
	});
});

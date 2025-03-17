// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, ObjectHelper, Urn } from "@twin.org/core";
import type { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { TEST_IDENTITY_ID } from "./setupTestEnv";
import type { VerifiableItem } from "../src/entities/verifiableItem";
import { EntityStorageVerifiableStorageConnector } from "../src/entityStorageVerifiableStorageConnector";

let verifiableItemId: string;

describe("EntityStorageVerifiableStorageConnector", () => {
	test("Can create a verifiable item", async () => {
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(
			TEST_IDENTITY_ID,
			ObjectHelper.toBytes({
				bar: "foo"
			})
		);
		const urn = Urn.fromValidString(result.id);

		expect(urn.namespaceIdentifier()).toEqual("verifiable");
		expect(urn.namespaceMethod()).toEqual("entity-storage");
		expect(urn.namespaceSpecific(1).length).toEqual(64);

		expect(result.receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(result.receipt.type).toEqual("VerifiableStorageEntityStorageReceipt");

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VerifiableItem>>(
				"verifiable-item"
			).getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].controller).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].data).toEqual(Converter.bytesToBase64(ObjectHelper.toBytes({ bar: "foo" })));

		verifiableItemId = result.id;
	});

	test("Can update a verifiable item", async () => {
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.update(
			TEST_IDENTITY_ID,
			verifiableItemId,
			ObjectHelper.toBytes({
				bar: "bar"
			})
		);

		expect(result["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(result.type).toEqual("VerifiableStorageEntityStorageReceipt");

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VerifiableItem>>(
				"verifiable-item"
			).getStore();
		expect(store?.[0].controller).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].data).toEqual(Converter.bytesToBase64(ObjectHelper.toBytes({ bar: "bar" })));
	});

	test("Can resolve a verifiable item", async () => {
		const connector = new EntityStorageVerifiableStorageConnector();
		const response = await connector.get(verifiableItemId);

		expect(response.receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(response.receipt.type).toEqual("VerifiableStorageEntityStorageReceipt");
		expect(response.data).toEqual(ObjectHelper.toBytes({ bar: "bar" }));
	});

	test("Can remove a verifiable item", async () => {
		const connector = new EntityStorageVerifiableStorageConnector();
		await connector.remove(TEST_IDENTITY_ID, verifiableItemId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VerifiableItem>>(
				"verifiable-item"
			).getStore();
		expect(store?.length).toEqual(0);
	});
});

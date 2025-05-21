// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, ObjectHelper, Urn } from "@twin.org/core";
import type { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { TEST_USER_IDENTITY_0, TEST_USER_IDENTITY_1 } from "./setupTestEnv";
import type { VerifiableItem } from "../src/entities/verifiableItem";
import { EntityStorageVerifiableStorageConnector } from "../src/entityStorageVerifiableStorageConnector";

let verifiableItemId: string;

describe("EntityStorageVerifiableStorageConnector", () => {
	test("Can create a verifiable item", async () => {
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(
			TEST_USER_IDENTITY_0,
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
		expect(store[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store[0].creator).toEqual(TEST_USER_IDENTITY_0);
		expect(store[0].data).toEqual(Converter.bytesToBase64(ObjectHelper.toBytes({ bar: "foo" })));
		expect(store[0].allowlist).toEqual([TEST_USER_IDENTITY_0]);

		verifiableItemId = result.id;
	});

	test("Can update a verifiable item", async () => {
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.update(
			TEST_USER_IDENTITY_0,
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
		expect(store[0].creator).toEqual(TEST_USER_IDENTITY_0);
		expect(store[0].data).toEqual(Converter.bytesToBase64(ObjectHelper.toBytes({ bar: "bar" })));
		expect(store[0].allowlist).toEqual([TEST_USER_IDENTITY_0]);
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
		await connector.remove(TEST_USER_IDENTITY_0, verifiableItemId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<VerifiableItem>>(
				"verifiable-item"
			).getStore();
		expect(store?.length).toEqual(0);
	});

	test("Can store a verifiable item with additional allow list", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [TEST_USER_IDENTITY_1]);

		const getResult = await connector.get(result.id);
		expect(getResult.data).toEqual(Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!"));
		expect(getResult.allowList).toEqual([TEST_USER_IDENTITY_0, TEST_USER_IDENTITY_1]);
	});

	test("Can fail to update a verifiable item when user is not in allow list", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [
			"0x0000000000000000000000000000000000000000000000000000000000000000"
		]);

		const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		await expect(connector.update(TEST_USER_IDENTITY_1, result.id, data2)).rejects.toThrow(
			"notInAllowList"
		);
	});

	test("Can update a verifiable item when user is in allow list", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [TEST_USER_IDENTITY_1]);

		const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		await connector.update(TEST_USER_IDENTITY_0, result.id, data2);

		const getResult = await connector.get(result.id);
		expect(getResult.data).toEqual(
			Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!")
		);
		expect(getResult.allowList).toEqual([TEST_USER_IDENTITY_0, TEST_USER_IDENTITY_1]);
	});

	test("Can update a verifiable item when user is in allow list, then fail when they are removed", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [TEST_USER_IDENTITY_1]);

		const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		// Updating but passing an empty allow list, which will remove user 1
		await connector.update(TEST_USER_IDENTITY_1, result.id, data2, []);

		// Now try to update again, which should fail
		await expect(connector.update(TEST_USER_IDENTITY_1, result.id, data2)).rejects.toThrow(
			"notInAllowList"
		);
	});

	test("Can not remove a verifiable item unless you are the creator", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const connector = new EntityStorageVerifiableStorageConnector();
		const result = await connector.create(TEST_USER_IDENTITY_0, data);

		await expect(connector.remove(TEST_USER_IDENTITY_1, result.id)).rejects.toThrow("notCreator");
	});
});

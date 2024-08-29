// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, ObjectHelper, Urn } from "@gtsc/core";
import type { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import { TEST_IDENTITY_ID } from "./setupTestEnv";
import type { ImmutableItem } from "../src/entities/immutableItem";
import { EntityStorageImmutableStorageConnector } from "../src/entityStorageImmutableStorageConnector";

let immuutableItemId: string;

describe("EntityStorageImmutableStorageConnector", () => {
	test("Can store an immutable item", async () => {
		const connector = new EntityStorageImmutableStorageConnector();
		const idUrn = await connector.store(
			TEST_IDENTITY_ID,
			ObjectHelper.toBytes({
				bar: "foo"
			})
		);
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("immutable");
		expect(urn.namespaceMethod()).toEqual("entity-storage");
		expect(urn.namespaceSpecific(1).length).toEqual(64);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<ImmutableItem>>(
				"immutable-item"
			).getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].controller).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].data).toEqual(Converter.bytesToBase64(ObjectHelper.toBytes({ bar: "foo" })));

		immuutableItemId = idUrn;
	});

	test("Can resolve an immutable item", async () => {
		const connector = new EntityStorageImmutableStorageConnector();
		const response = await connector.get(immuutableItemId);

		expect(response).toEqual(ObjectHelper.toBytes({ bar: "foo" }));
	});

	test("Can remove an immutable item", async () => {
		const connector = new EntityStorageImmutableStorageConnector();
		await connector.remove(TEST_IDENTITY_ID, immuutableItemId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<ImmutableItem>>(
				"immutable-item"
			).getStore();
		expect(store?.length).toEqual(0);
	});
});

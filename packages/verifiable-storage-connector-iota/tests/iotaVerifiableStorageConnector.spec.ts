// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, Urn } from "@twin.org/core";
import {
	setupTestEnv,
	TEST_CLIENT_OPTIONS,
	TEST_EXPLORER_URL,
	TEST_MNEMONIC_NAME,
	TEST_NETWORK,
	TEST_NODE_IDENTITY,
	TEST_USER_IDENTITY_0,
	TEST_USER_IDENTITY_1,
	USER_ADDRESS_0,
	USER_ADDRESS_1
} from "./setupTestEnv";
import { IotaVerifiableStorageConnector } from "../src/iotaVerifiableStorageConnector";
import type { IVerifiableStorageIotaReceipt } from "../src/models/IVerifiableStorageIotaReceipt";

let connector: IotaVerifiableStorageConnector;

let itemId: string;
let digest: string;

describe("IotaVerifiableStorageConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
		connector = new IotaVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000,
				enableCostLogging: true
			}
		});
		// Deploy the Move contract
		const componentState: { packageId?: string } = {};
		await connector.start(TEST_NODE_IDENTITY, undefined, componentState);
		console.debug(
			"Deployed contract",
			`${TEST_EXPLORER_URL}object/${componentState.packageId}?network=${TEST_NETWORK}`
		);
	});

	test("Cannot store an item before bootstrap", async () => {
		const unstartedConnector = new IotaVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000
			}
		});
		const data = Converter.utf8ToBytes("Test data");
		await expect(unstartedConnector.create(TEST_USER_IDENTITY_0, data)).rejects.toThrow(
			"connectorNotStarted"
		);
	});

	test("Can store a verifiable item", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const result = await connector.create(TEST_USER_IDENTITY_0, data);
		itemId = result.id;
		const urn = Urn.fromValidString(result.id);
		expect(urn.namespaceIdentifier()).toEqual("verifiable");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1].length).toBeGreaterThan(0);
		expect(specificParts[2].length).toBeGreaterThan(0);

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[2]}?network=${TEST_NETWORK}`
		);

		const receipt = result.receipt as unknown as IVerifiableStorageIotaReceipt;

		expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
		expect(receipt.epoch.length).greaterThan(0);
		expect(receipt.digest.length).greaterThan(0);

		digest = receipt.digest;

		console.debug(
			"Digest",
			`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
		);
	});

	test("Can retrieve a verifiable item", async () => {
		const getResult = await connector.get(itemId);
		expect(getResult.data).toEqual(Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!"));
		const receipt = getResult.receipt as unknown as IVerifiableStorageIotaReceipt;

		expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
		expect(receipt.epoch.length).greaterThan(0);
		expect(receipt.digest.length).greaterThan(0);
		expect(receipt.digest).toEqual(digest);

		console.debug(
			"Digest",
			`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
		);
	});

	test("Can update a verifiable item", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		const result = await connector.update(TEST_USER_IDENTITY_0, itemId, data);

		const receipt = result as unknown as IVerifiableStorageIotaReceipt;

		expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
		expect(receipt.epoch.length).greaterThan(0);
		expect(receipt.digest.length).greaterThan(0);

		digest = receipt.digest;

		console.debug(
			"Digest",
			`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
		);
	});

	test("Can retrieve an updated verifiable item", async () => {
		const getResult = await connector.get(itemId);
		expect(getResult.data).toEqual(
			Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!")
		);
		const receipt = getResult.receipt as unknown as IVerifiableStorageIotaReceipt;

		expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
		expect(receipt.epoch.length).greaterThan(0);
		expect(receipt.digest.length).greaterThan(0);
		expect(receipt.digest).toEqual(digest);

		console.debug(
			"Digest",
			`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
		);
	});

	test("Can remove a verifiable item", async () => {
		const data = Converter.utf8ToBytes("Data to be deleted");
		const storeResult = await connector.create(TEST_USER_IDENTITY_0, data);
		const getResult = await connector.get(storeResult.id);
		expect(getResult.data).toEqual(data);
		await connector.remove(TEST_USER_IDENTITY_0, storeResult.id);
		await expect(connector.get(storeResult.id)).rejects.toThrow("objectNotFound");
	});

	test("Can store a verifiable item with additional allow list", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [USER_ADDRESS_1]);
		itemId = result.id;
		const urn = Urn.fromValidString(result.id);
		const specificParts = urn.namespaceSpecificParts();

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[2]}?network=${TEST_NETWORK}`
		);

		const receipt = result.receipt as unknown as IVerifiableStorageIotaReceipt;

		expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
		expect(receipt.epoch.length).greaterThan(0);
		expect(receipt.digest.length).greaterThan(0);

		digest = receipt.digest;

		console.debug(
			"Digest",
			`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
		);

		const getResult = await connector.get(itemId);
		expect(getResult.data).toEqual(Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!"));
		expect(getResult.allowList).toEqual([USER_ADDRESS_0, USER_ADDRESS_1]);
	});

	test("Can fail to update a verifiable item when user is not in allow list", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [
			"0x0000000000000000000000000000000000000000000000000000000000000000"
		]);
		itemId = result.id;
		const urn = Urn.fromValidString(result.id);
		const specificParts = urn.namespaceSpecificParts();

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[2]}?network=${TEST_NETWORK}`
		);

		const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		await expect(connector.update(TEST_USER_IDENTITY_1, itemId, data2)).rejects.toThrow(
			"notInAllowList"
		);
	});

	test("Can update a verifiable item when user is in allow list", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [USER_ADDRESS_1]);
		itemId = result.id;
		const urn = Urn.fromValidString(result.id);
		const specificParts = urn.namespaceSpecificParts();

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[2]}?network=${TEST_NETWORK}`
		);

		const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		const result2 = await connector.update(TEST_USER_IDENTITY_1, itemId, data2);

		const receipt = result2 as unknown as IVerifiableStorageIotaReceipt;
		expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
		expect(receipt.epoch.length).greaterThan(0);
		expect(receipt.digest.length).greaterThan(0);

		digest = receipt.digest;

		console.debug(
			"Digest",
			`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
		);
	});

	test("Can update a verifiable item when user is in allow list, then fail when they are removed", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const result = await connector.create(TEST_USER_IDENTITY_0, data, [USER_ADDRESS_1]);
		itemId = result.id;

		const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
		// Updating but passing an empty allow list, which will remove user 1
		await connector.update(TEST_USER_IDENTITY_1, itemId, data2, []);

		// Now try to update again, which should fail
		await expect(connector.update(TEST_USER_IDENTITY_1, itemId, data2)).rejects.toThrow(
			"notInAllowList"
		);
	});

	test("Can not remove a verifiable item unless you are the creator", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
		const result = await connector.create(TEST_USER_IDENTITY_0, data);
		itemId = result.id;

		await expect(connector.remove(TEST_USER_IDENTITY_1, itemId)).rejects.toThrow("notCreator");
	});
});

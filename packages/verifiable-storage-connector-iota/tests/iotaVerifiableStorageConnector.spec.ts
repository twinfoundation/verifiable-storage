// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, Urn } from "@twin.org/core";
import {
	setupTestEnv,
	TEST_CLIENT_OPTIONS,
	TEST_NODE_IDENTITY,
	TEST_USER_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	TEST_NETWORK,
	TEST_EXPLORER_URL
} from "./setupTestEnv";
import { IotaVerifiableStorageConnector } from "../src/iotaVerifiableStorageConnector";

let verifiableDeployerConnector: IotaVerifiableStorageConnector;
let verifiableUserConnector: IotaVerifiableStorageConnector;

let itemId: string;

describe("IotaVerifiableStorageConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
		verifiableDeployerConnector = new IotaVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000
			}
		});
		// Deploy the Move contract
		await verifiableDeployerConnector.start(TEST_NODE_IDENTITY);
		// Create connector for user operations
		verifiableUserConnector = new IotaVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000
			}
		});
		await verifiableUserConnector.start(TEST_NODE_IDENTITY);
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
		await expect(unstartedConnector.create(TEST_USER_IDENTITY_ID, data)).rejects.toThrow(
			"connectorNotStarted"
		);
	});

	test("Can store a verifiable item", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA  Verifiable Storage!");
		const result = await verifiableUserConnector.create(TEST_USER_IDENTITY_ID, data);
		itemId = result.id;
		const urn = Urn.fromValidString(result.id);
		expect(urn.namespaceIdentifier()).toEqual("verifiable");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);

		expect(result.receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(result.receipt.type).toEqual("VerifiableStorageIotaReceipt");
	});

	test("Can update a verifiable item", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA  Verifiable Storage Updated!");
		const result = await verifiableUserConnector.update(TEST_USER_IDENTITY_ID, itemId, data);
		expect(result["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(result.type).toEqual("VerifiableStorageIotaReceipt");
	});

	test("Can retrieve a verifiable item", async () => {
		const getResult = await verifiableUserConnector.get(itemId);
		expect(getResult.data).toEqual(
			Converter.utf8ToBytes("Hello, IOTA  Verifiable Storage Updated!")
		);
		expect(getResult.receipt.type).toEqual("VerifiableStorageIotaReceipt");
	});

	test("Can remove a verifiable item", async () => {
		const data = Converter.utf8ToBytes("Data to be deleted");
		const storeResult = await verifiableUserConnector.create(TEST_USER_IDENTITY_ID, data);
		const getResult = await verifiableUserConnector.get(storeResult.id);
		expect(getResult.data).toEqual(data);
		await verifiableUserConnector.remove(TEST_USER_IDENTITY_ID, storeResult.id);
		await expect(verifiableUserConnector.get(storeResult.id)).rejects.toThrow("objectNotFound");
	});
});

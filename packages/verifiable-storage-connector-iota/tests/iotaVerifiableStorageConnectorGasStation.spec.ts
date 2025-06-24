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
	USER_ADDRESS_1,
	GAS_STATION_URL,
	GAS_STATION_AUTH_TOKEN,
	GAS_BUDGET
} from "./setupTestEnv";
import { IotaVerifiableStorageConnector } from "../src/iotaVerifiableStorageConnector";
import type { IIotaVerifiableStorageConnectorConfig } from "../src/models/IIotaVerifiableStorageConnectorConfig";
import type { IVerifiableStorageIotaReceipt } from "../src/models/IVerifiableStorageIotaReceipt";

let gasStationConnector: IotaVerifiableStorageConnector;
let regularConnector: IotaVerifiableStorageConnector;
let itemId: string;
let digest: string;

describe("IotaVerifiableStorageConnector with Gas Station", () => {
	let gasStationConfig: IIotaVerifiableStorageConnectorConfig;
	let regularConfig: IIotaVerifiableStorageConnectorConfig;

	beforeAll(async () => {
		await setupTestEnv();

		// Gas station configuration
		gasStationConfig = {
			clientOptions: TEST_CLIENT_OPTIONS,
			vaultMnemonicId: TEST_MNEMONIC_NAME,
			network: TEST_NETWORK,
			gasBudget: GAS_BUDGET,
			enableCostLogging: true,
			gasStation: {
				gasStationUrl: GAS_STATION_URL,
				gasStationAuthToken: GAS_STATION_AUTH_TOKEN
			}
		};

		// Regular configuration (without gas station)
		regularConfig = {
			clientOptions: TEST_CLIENT_OPTIONS,
			vaultMnemonicId: TEST_MNEMONIC_NAME,
			network: TEST_NETWORK,
			gasBudget: GAS_BUDGET,
			enableCostLogging: true
		};

		// Connector for deployment with gas station (using node/deployer mnemonic)
		gasStationConnector = new IotaVerifiableStorageConnector({
			config: gasStationConfig
		});

		// Regular connector for comparison
		regularConnector = new IotaVerifiableStorageConnector({
			config: regularConfig
		});

		// Deploy the Move contract using gas station
		console.debug("Starting gas station connector deployment...");
		const componentState: { contractDeployments?: { [id: string]: string } } = {};
		try {
			await gasStationConnector.start(TEST_NODE_IDENTITY, undefined, componentState);
			console.debug("Component State (Gas Station)", componentState);

			const keys = Object.keys(componentState.contractDeployments ?? {});
			console.debug(
				"Deployed contract with gas station",
				`${TEST_EXPLORER_URL}object/${componentState.contractDeployments?.[keys[0]]}?network=${TEST_NETWORK}`
			);
		} catch (error) {
			console.error("Gas station deployment failed:", error);
			throw error;
		}
	}, 120000); // Increase timeout to 2 minutes

	describe("Configuration", () => {
		test("Should create verifiable storage connector with gas station configuration", () => {
			const connector = new IotaVerifiableStorageConnector({
				config: gasStationConfig
			});

			expect(connector).toBeDefined();
			expect(connector.CLASS_NAME).toBe("IotaVerifiableStorageConnector");
		});

		test("Should create verifiable storage connector without gas station configuration", () => {
			const connector = new IotaVerifiableStorageConnector({
				config: regularConfig
			});

			expect(connector).toBeDefined();
			expect(connector.CLASS_NAME).toBe("IotaVerifiableStorageConnector");
		});

		test("Should create verifiable storage connector with custom gas budget", () => {
			const customGasBudgetConfig: IIotaVerifiableStorageConnectorConfig = {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: GAS_BUDGET * 2, // Double the default gas budget
				gasStation: {
					gasStationUrl: GAS_STATION_URL,
					gasStationAuthToken: GAS_STATION_AUTH_TOKEN
				}
			};

			const connector = new IotaVerifiableStorageConnector({
				config: customGasBudgetConfig
			});

			expect(connector).toBeDefined();
			expect(connector.CLASS_NAME).toBe("IotaVerifiableStorageConnector");
		});
	});

	describe("Gas Station Integration", () => {
		test("Should test gas station connectivity before attempting verifiable storage operations", async () => {
			await expect(fetch(GAS_STATION_URL, { method: "GET" })).resolves.toMatchObject({
				ok: true
			});
		}, 10000);

		test("Cannot store an item before start (gas station)", async () => {
			const unstartedConnector = new IotaVerifiableStorageConnector({
				config: gasStationConfig
			});
			const data = Converter.utf8ToBytes("Test data");
			await expect(unstartedConnector.create(TEST_USER_IDENTITY_0, data)).rejects.toThrow(
				"connectorNotStarted"
			);
		});

		test("Can store a verifiable item using gas station", async () => {
			const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage with Gas Station!");
			const result = await gasStationConnector.create(TEST_USER_IDENTITY_0, data);
			itemId = result.id;
			const urn = Urn.fromValidString(result.id);
			expect(urn.namespaceIdentifier()).toEqual("verifiable");
			const specificParts = urn.namespaceSpecificParts();
			expect(specificParts[0]).toEqual("iota");
			expect(specificParts[1].length).toBeGreaterThan(0);
			expect(specificParts[2].length).toBeGreaterThan(0);

			console.debug(
				"Created with gas station",
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
		}, 30000);

		test("Should compare regular vs gas station item creation", async () => {
			// Start the regular connector first (deploy contract without gas station)
			const regularComponentState: { contractDeployments?: { [id: string]: string } } = {};
			await regularConnector.start(TEST_NODE_IDENTITY, undefined, regularComponentState);

			// Create with regular connector
			const regularData = Converter.utf8ToBytes("Regular verifiable storage item");
			const regularResult = await regularConnector.create(TEST_USER_IDENTITY_0, regularData);

			// Create with gas station connector
			const gasStationData = Converter.utf8ToBytes("Gas station verifiable storage item");
			const gasStationResult = await gasStationConnector.create(
				TEST_USER_IDENTITY_0,
				gasStationData
			);

			expect(regularResult.id).toBeDefined();
			expect(gasStationResult.id).toBeDefined();
			expect(regularResult.id).not.toBe(gasStationResult.id);

			// Both should resolve successfully
			const regularItem = await regularConnector.get(regularResult.id);
			const gasStationItem = await gasStationConnector.get(gasStationResult.id);

			expect(regularItem.data).toEqual(regularData);
			expect(gasStationItem.data).toEqual(gasStationData);
		}, 60000);
	});

	describe("Verifiable Storage Operations with Gas Station", () => {
		test("Can retrieve a verifiable item created with gas station", async () => {
			const getResult = await gasStationConnector.get(itemId);
			expect(getResult.data).toEqual(
				Converter.utf8ToBytes("Hello, IOTA Verifiable Storage with Gas Station!")
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

		test("Can update a verifiable item using gas station", async () => {
			const data = Converter.utf8ToBytes(
				"Hello, IOTA Verifiable Storage Updated with Gas Station!"
			);
			const result = await gasStationConnector.update(TEST_USER_IDENTITY_0, itemId, data);

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
		}, 30000);

		test("Can retrieve an updated verifiable item created with gas station", async () => {
			const getResult = await gasStationConnector.get(itemId);
			expect(getResult.data).toEqual(
				Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated with Gas Station!")
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

		test("Can remove a verifiable item using gas station", async () => {
			const data = Converter.utf8ToBytes("Data to be deleted with gas station");
			const storeResult = await gasStationConnector.create(TEST_USER_IDENTITY_0, data);
			const getResult = await gasStationConnector.get(storeResult.id);
			expect(getResult.data).toEqual(data);
			await gasStationConnector.remove(TEST_USER_IDENTITY_0, storeResult.id);
			await expect(gasStationConnector.get(storeResult.id)).rejects.toThrow("objectNotFound");
		}, 30000);

		test("Can store a verifiable item with additional allow list using gas station", async () => {
			const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage with Allow List!");
			const result = await gasStationConnector.create(TEST_USER_IDENTITY_0, data, [USER_ADDRESS_1]);
			const testItemId = result.id;
			const urn = Urn.fromValidString(result.id);
			const specificParts = urn.namespaceSpecificParts();

			console.debug(
				"Created with gas station and allow list",
				`${TEST_EXPLORER_URL}object/${specificParts[2]}?network=${TEST_NETWORK}`
			);

			const receipt = result.receipt as unknown as IVerifiableStorageIotaReceipt;

			expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
			expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
			expect(receipt.epoch.length).greaterThan(0);
			expect(receipt.digest.length).greaterThan(0);

			const getResult = await gasStationConnector.get(testItemId);
			expect(getResult.data).toEqual(
				Converter.utf8ToBytes("Hello, IOTA Verifiable Storage with Allow List!")
			);
			expect(getResult.allowList).toEqual([USER_ADDRESS_0, USER_ADDRESS_1]);
		}, 30000);

		test("Can update a verifiable item when user is in allow list using gas station", async () => {
			const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage with Gas Station!");
			const result = await gasStationConnector.create(TEST_USER_IDENTITY_0, data, [USER_ADDRESS_1]);
			const testItemId = result.id;
			const urn = Urn.fromValidString(result.id);
			const specificParts = urn.namespaceSpecificParts();

			console.debug(
				"Created with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[2]}?network=${TEST_NETWORK}`
			);

			const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated by User 1!");
			const result2 = await gasStationConnector.update(TEST_USER_IDENTITY_1, testItemId, data2);

			const receipt = result2 as unknown as IVerifiableStorageIotaReceipt;
			expect(receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
			expect(receipt.type).toEqual("VerifiableStorageIotaReceipt");
			expect(receipt.epoch.length).greaterThan(0);
			expect(receipt.digest.length).greaterThan(0);

			console.debug(
				"Digest",
				`${TEST_EXPLORER_URL}txblock/${receipt.digest}?network=${TEST_NETWORK}`
			);
		}, 30000);
	});

	describe("Gas Station Error Handling", () => {
		test("Should handle gas station unavailable gracefully", async () => {
			const invalidGasStationConfig: IIotaVerifiableStorageConnectorConfig = {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasStation: {
					gasStationUrl: "http://localhost:9999", // Invalid port
					gasStationAuthToken: GAS_STATION_AUTH_TOKEN
				}
			};

			const connector = new IotaVerifiableStorageConnector({
				config: invalidGasStationConfig
			});

			// The start method should fail when trying to deploy with invalid gas station
			const componentState: { contractDeployments?: { [id: string]: string } } = {};
			await expect(
				connector.start(TEST_NODE_IDENTITY, undefined, componentState)
			).rejects.toThrow();
		}, 20000);

		test("Should handle invalid gas station auth token", async () => {
			const invalidAuthConfig: IIotaVerifiableStorageConnectorConfig = {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasStation: {
					gasStationUrl: GAS_STATION_URL,
					gasStationAuthToken: "invalid-token"
				}
			};

			const connector = new IotaVerifiableStorageConnector({
				config: invalidAuthConfig
			});

			// The start method should fail when trying to deploy with invalid auth token
			const componentState: { contractDeployments?: { [id: string]: string } } = {};
			await expect(
				connector.start(TEST_NODE_IDENTITY, undefined, componentState)
			).rejects.toThrow();
		}, 20000);

		test("Should fail to update a verifiable item when user is not in allow list (gas station)", async () => {
			const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
			const result = await gasStationConnector.create(TEST_USER_IDENTITY_0, data, [
				"0x0000000000000000000000000000000000000000000000000000000000000000"
			]);
			const testItemId = result.id;

			const data2 = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage Updated!");
			await expect(
				gasStationConnector.update(TEST_USER_IDENTITY_1, testItemId, data2)
			).rejects.toThrow("notInAllowList");
		}, 30000);

		test("Should fail to remove a verifiable item unless you are the creator (gas station)", async () => {
			const data = Converter.utf8ToBytes("Hello, IOTA Verifiable Storage!");
			const result = await gasStationConnector.create(TEST_USER_IDENTITY_0, data);
			const testItemId = result.id;

			await expect(gasStationConnector.remove(TEST_USER_IDENTITY_1, testItemId)).rejects.toThrow(
				"notCreator"
			);
		}, 30000);
	});
});

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
// import { Converter, Urn } from "@twin.org/core";
// import {
// 	setupTestEnv,
// 	TEST_CLIENT_OPTIONS,
// 	TEST_NODE_IDENTITY,
// 	TEST_USER_IDENTITY_ID,
// 	TEST_USER_MNEMONIC_NAME,
// 	TEST_NETWORK,
// 	TEST_NODE_MNEMONIC_NAME
// } from "./setupTestEnv";
// import { IotaRebasedImmutableStorageConnector } from "../src/iotaRebasedImmutableStorageConnector";

// const nodeIdentity = TEST_NODE_IDENTITY;
// const userIdentity = TEST_USER_IDENTITY_ID;
// let immutableDeployerConnector: IotaRebasedImmutableStorageConnector;
// let immutableUserConnector: IotaRebasedImmutableStorageConnector;

/*
 * ATTENTION *
 * These tests have been commented out due to known latency issues with the Indexer.
 * The current checkpoint-based synchronization introduces delays, causing read-after-write consistency to fail in certain cases. This results in intermittent test failures.
 * Once the latency issues are resolved, these tests should be re-enabled.
 */

describe("IotaRebasedImmutableStorageConnector", () => {
	test("dummy-test", () => {});
	// beforeAll(async () => {
	// 	await setupTestEnv();
	// 	immutableDeployerConnector = new IotaRebasedImmutableStorageConnector({
	// 		config: {
	// 			clientOptions: TEST_CLIENT_OPTIONS,
	// 			vaultMnemonicId: TEST_NODE_MNEMONIC_NAME,
	// 			network: TEST_NETWORK,
	// 			gasBudget: 1_000_000_000
	// 		}
	// 	});
	// 	// Deploy the Move contract
	// 	await immutableDeployerConnector.start(nodeIdentity);
	// 	// Create connector for user operations
	// 	immutableUserConnector = new IotaRebasedImmutableStorageConnector({
	// 		config: {
	// 			clientOptions: TEST_CLIENT_OPTIONS,
	// 			vaultMnemonicId: TEST_USER_MNEMONIC_NAME, // user mnemonic
	// 			network: TEST_NETWORK,
	// 			gasBudget: 1_000_000_000
	// 		}
	// 	});
	// 	await immutableUserConnector.start(userIdentity);
	// });
	// test("Cannot store an item before bootstrap", async () => {
	// 	const unstartedConnector = new IotaRebasedImmutableStorageConnector({
	// 		config: {
	// 			clientOptions: TEST_CLIENT_OPTIONS,
	// 			vaultMnemonicId: TEST_USER_MNEMONIC_NAME,
	// 			network: TEST_NETWORK,
	// 			gasBudget: 1_000_000_000
	// 		}
	// 	});
	// 	const data = Converter.utf8ToBytes("Test data");
	// 	await expect(unstartedConnector.store(userIdentity, data)).rejects.toThrow(
	// 		"connectorNotStarted"
	// 	);
	// });
	// test("Can store an immutable item", async () => {
	// 	const data = Converter.utf8ToBytes("Hello, IOTA Rebased Immutable Storage!");
	// 	const result = await immutableUserConnector.store(userIdentity, data);
	// 	const urn = Urn.fromValidString(result.id);
	// 	expect(urn.namespaceIdentifier()).toEqual("immutable");
	// 	const specificParts = urn.namespaceSpecificParts();
	// 	expect(specificParts[0]).toEqual("iota-rebased");
	// 	expect(specificParts[1].length).toBeGreaterThan(0);
	// 	expect(result.receipt["@context"]).toEqual("https://schema.twindev.org/immutable-storage/");
	// 	expect(result.receipt.type).toEqual("ImmutableStorageIotaRebasedReceipt");
	// });
	// test("Can retrieve an immutable item", async () => {
	// 	const data = Converter.utf8ToBytes("Hello, IOTA Rebased Immutable Storage!");
	// 	const storeResult = await immutableUserConnector.store(userIdentity, data);
	// 	const getResult = await immutableUserConnector.get(storeResult.id);
	// 	expect(getResult.data).toEqual(data);
	// 	expect(getResult.receipt.type).toEqual("ImmutableStorageIotaRebasedReceipt");
	// });
	// test("Can remove an immutable item", async () => {
	// 	const data = Converter.utf8ToBytes("Data to be deleted");
	// 	const storeResult = await immutableUserConnector.store(userIdentity, data);
	// 	await immutableUserConnector.remove(userIdentity, storeResult.id);
	// 	await expect(immutableUserConnector.get(storeResult.id)).rejects.toThrow("objectNotFound");
	// });
});

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, Urn } from "@twin.org/core";
import {
	setupTestEnv,
	TEST_CLIENT_OPTIONS,
	TEST_NODE_IDENTITY,
	TEST_USER_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	TEST_NETWORK
} from "./setupTestEnv";
import { IotaRebasedImmutableStorageConnector } from "../src/iotaRebasedImmutableStorageConnector";

let immutableDeployerConnector: IotaRebasedImmutableStorageConnector;
let immutableUserConnector: IotaRebasedImmutableStorageConnector;

/*
 * TODO
 * These tests use a wait for resolution due to known latency issues with the Indexer.
 * The current checkpoint-based synchronization introduces delays, causing read-after-write consistency to fail in certain cases. This results in intermittent test failures.
 * Once the latency issues are resolved, the wait can be removed.
 */

/**
 * Wait for the immutable item get to work.
 * @param getId The immutable item.
 */
async function waitForResolution(getId: string): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			await immutableUserConnector.get(getId);
			return;
		} catch {}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// eslint-disable-next-line no-restricted-syntax
	throw new Error("Immutable item get failed");
}

/**
 * Wait for the immutable item to fail get.
 * @param getId The immutable item.
 */
async function waitForFailedResolution(getId: string): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			await immutableUserConnector.get(getId);
		} catch {
			return;
		}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// eslint-disable-next-line no-restricted-syntax
	throw new Error("Immutable item get still working");
}

describe("IotaRebasedImmutableStorageConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
		immutableDeployerConnector = new IotaRebasedImmutableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000
			}
		});
		// Deploy the Move contract
		await immutableDeployerConnector.start(TEST_NODE_IDENTITY);
		// Create connector for user operations
		immutableUserConnector = new IotaRebasedImmutableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000
			}
		});
		await immutableUserConnector.start(TEST_NODE_IDENTITY);
	});
	test("Cannot store an item before bootstrap", async () => {
		const unstartedConnector = new IotaRebasedImmutableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: 1_000_000_000
			}
		});
		const data = Converter.utf8ToBytes("Test data");
		await expect(unstartedConnector.store(TEST_USER_IDENTITY_ID, data)).rejects.toThrow(
			"connectorNotStarted"
		);
	});
	test("Can store an immutable item", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Rebased Immutable Storage!");
		const result = await immutableUserConnector.store(TEST_USER_IDENTITY_ID, data);
		const urn = Urn.fromValidString(result.id);
		expect(urn.namespaceIdentifier()).toEqual("immutable");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota-rebased");
		expect(specificParts[1].length).toBeGreaterThan(0);
		expect(result.receipt["@context"]).toEqual("https://schema.twindev.org/immutable-storage/");
		expect(result.receipt.type).toEqual("ImmutableStorageIotaRebasedReceipt");
	});
	test("Can retrieve an immutable item", async () => {
		const data = Converter.utf8ToBytes("Hello, IOTA Rebased Immutable Storage!");
		const storeResult = await immutableUserConnector.store(TEST_USER_IDENTITY_ID, data);
		await waitForResolution(storeResult.id);
		const getResult = await immutableUserConnector.get(storeResult.id);
		expect(getResult.data).toEqual(data);
		expect(getResult.receipt.type).toEqual("ImmutableStorageIotaRebasedReceipt");
	});
	test("Can remove an immutable item", async () => {
		const data = Converter.utf8ToBytes("Data to be deleted");
		const storeResult = await immutableUserConnector.store(TEST_USER_IDENTITY_ID, data);
		await waitForResolution(storeResult.id);
		const getResult = await immutableUserConnector.get(storeResult.id);
		expect(getResult.data).toEqual(data);
		await immutableUserConnector.remove(TEST_USER_IDENTITY_ID, storeResult.id);
		await waitForFailedResolution(storeResult.id);
		await expect(immutableUserConnector.get(storeResult.id)).rejects.toThrow("objectNotFound");
	});
});

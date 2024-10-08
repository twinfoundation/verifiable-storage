// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Is, ObjectHelper, Urn } from "@twin.org/core";
import {
	TEST_BECH32_HRP,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	setupTestEnv
} from "./setupTestEnv";
import { IotaImmutableStorageConnector } from "../src/iotaImmutableStorageConnector";

let immutableStorageId: string;

describe("IotaImmutableStorageConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("Can store an immutable item", async () => {
		const connector = new IotaImmutableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		const result = await connector.store(TEST_IDENTITY_ID, ObjectHelper.toBytes({ bar: "foo" }));
		const urn = Urn.fromValidString(result.id);

		console.debug("Stored Immutable Storage Id", result.id);
		console.debug(
			"Stored Output",
			`${process.env.TEST_EXPLORER_URL}output/${urn.namespaceSpecificParts(2)[0]}0000`
		);
		expect(urn.namespaceIdentifier()).toEqual("immutable");

		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_BECH32_HRP);
		expect(specificParts[2].length).toEqual(66);

		expect(result.receipt["@context"]).toEqual("https://schema.twindev.org/immutable-storage/");
		expect(result.receipt.type).toEqual("ImmutableStorageIotaReceipt");
		expect(Is.integer(result.receipt.milestoneIndexBooked)).toEqual(true);
		expect(Is.integer(result.receipt.milestoneTimestampBooked)).toEqual(true);

		immutableStorageId = result.id;
	});

	test("Can get an immutable item", async () => {
		const connector = new IotaImmutableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		const response = await connector.get(immutableStorageId);

		expect(response.receipt["@context"]).toEqual("https://schema.twindev.org/immutable-storage/");
		expect(response.receipt.type).toEqual("ImmutableStorageIotaReceipt");
		expect(Is.integer(response.receipt.milestoneIndexBooked)).toEqual(true);
		expect(Is.integer(response.receipt.milestoneTimestampBooked)).toEqual(true);

		expect(response.data).toEqual(ObjectHelper.toBytes({ bar: "foo" }));
	});

	test("Can remove an immutable item", async () => {
		const connector = new IotaImmutableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await connector.remove(TEST_IDENTITY_ID, immutableStorageId);
	});
});

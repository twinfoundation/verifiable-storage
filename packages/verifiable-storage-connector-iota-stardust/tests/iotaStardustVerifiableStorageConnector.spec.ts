// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Utils } from "@iota/sdk-wasm/node";
import { Is, ObjectHelper, Urn } from "@twin.org/core";
import {
	TEST_BECH32_HRP,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_IDENTITY_ID,
	TEST_MNEMONIC_NAME,
	setupTestEnv
} from "./setupTestEnv";
import { IotaStardustVerifiableStorageConnector } from "../src/iotaStardustVerifiableStorageConnector";

let verifiableStorageId: string;

describe("IotaStardustVerifiableStorageConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("Can create a verifiable item", async () => {
		const connector = new IotaStardustVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		const result = await connector.create(TEST_IDENTITY_ID, ObjectHelper.toBytes({ bar: "foo" }));
		const urn = Urn.fromValidString(result.id);
		const aliasId = urn.namespaceSpecificParts(2)[0];

		console.debug("Stored Verifiable Storage Id", result.id);
		console.debug(
			"Stored Output",
			`${process.env.TEST_EXPLORER_URL}addr/${Utils.aliasIdToBech32(aliasId, TEST_BECH32_HRP)}`
		);
		expect(urn.namespaceIdentifier()).toEqual("verifiable");

		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota-stardust");
		expect(specificParts[1]).toEqual(TEST_BECH32_HRP);
		expect(specificParts[2].length).toEqual(66);

		expect(result.receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(result.receipt.type).toEqual("VerifiableStorageIotaStardustReceipt");
		expect(Is.integer(result.receipt.milestoneIndexBooked)).toEqual(true);
		expect(Is.integer(result.receipt.milestoneTimestampBooked)).toEqual(true);

		verifiableStorageId = result.id;
	});

	test("Can update a verifiable item", async () => {
		const connector = new IotaStardustVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		const result = await connector.update(
			TEST_IDENTITY_ID,
			verifiableStorageId,
			ObjectHelper.toBytes({ bar: "bar" })
		);

		expect(result["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(result.type).toEqual("VerifiableStorageIotaStardustReceipt");
		expect(Is.integer(result.milestoneIndexBooked)).toEqual(true);
		expect(Is.integer(result.milestoneTimestampBooked)).toEqual(true);
	});

	test("Can get a verifiable item", async () => {
		const connector = new IotaStardustVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		const response = await connector.get(verifiableStorageId);

		expect(response.receipt["@context"]).toEqual("https://schema.twindev.org/verifiable-storage/");
		expect(response.receipt.type).toEqual("VerifiableStorageIotaStardustReceipt");
		expect(Is.integer(response.receipt.milestoneIndexBooked)).toEqual(true);
		expect(Is.integer(response.receipt.milestoneTimestampBooked)).toEqual(true);

		expect(response.data).toEqual(ObjectHelper.toBytes({ bar: "bar" }));
	});

	test("Can remove a verifiable item", async () => {
		const connector = new IotaStardustVerifiableStorageConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await connector.remove(TEST_IDENTITY_ID, verifiableStorageId);

		await expect(connector.get(verifiableStorageId)).rejects.toThrowError(
			"iotaStardustVerifiableStorageConnector.gettingFailed"
		);
	});
});

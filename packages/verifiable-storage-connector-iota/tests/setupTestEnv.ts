// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { requestIotaFromFaucetV0 } from "@iota/iota-sdk/faucet";
import { Guards, Is } from "@twin.org/core";
import { Bip39 } from "@twin.org/crypto";
import { Iota } from "@twin.org/dlt-iota";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import dotenv from "dotenv";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

Guards.stringValue("TestEnv", "TEST_NODE_ENDPOINT", process.env.TEST_NODE_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_FAUCET_ENDPOINT", process.env.TEST_FAUCET_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_COIN_TYPE", process.env.TEST_COIN_TYPE);
Guards.stringValue("TestEnv", "TEST_NETWORK", process.env.TEST_NETWORK);
Guards.stringValue("TestEnv", "TEST_EXPLORER_URL", process.env.TEST_EXPLORER_URL);

if (!Is.stringValue(process.env.TEST_MNEMONIC)) {
	// eslint-disable-next-line no-restricted-syntax
	throw new Error(
		`Please define TEST_MNEMONIC as a 24 word mnemonic either as an environment variable or inside an .env.dev file
         e.g. TEST_MNEMONIC="word0 word1 ... word23"
         You can generate one using the following command
         npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_`
	);
}
if (!Is.stringValue(process.env.TEST_2_MNEMONIC)) {
	// eslint-disable-next-line no-restricted-syntax
	throw new Error(
		`Please define TEST_2_MNEMONIC as a 24 word mnemonic either as an environment variable or inside an .env.dev file
     e.g. TEST_2_MNEMONIC="word0 word1 ... word23"
     You can generate one using the following command
     npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_2_ --merge-env`
	);
}
if (!Is.stringValue(process.env.TEST_NODE_MNEMONIC)) {
	// eslint-disable-next-line no-restricted-syntax
	throw new Error(
		`Please define TEST_NODE_MNEMONIC as a 24 word mnemonic either as an environment variable or inside an .env.dev file
     e.g. TEST_NODE_MNEMONIC="word0 word1 ... word23"
     You can generate one using the following command
     npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_NODE_ --merge-env`
	);
}

export const TEST_NODE_IDENTITY = "test-node-identity";
export const TEST_USER_IDENTITY_0 = "test-user-identity-0";
export const TEST_USER_IDENTITY_1 = "test-user-identity-1";
export const TEST_MNEMONIC_NAME = "test-mnemonic";
export const TEST_NETWORK = process.env.TEST_NETWORK;
export const TEST_FAUCET_ENDPOINT = process.env.TEST_FAUCET_ENDPOINT ?? "";
export const TEST_EXPLORER_URL = process.env.TEST_EXPLORER_URL;
export const TEST_CLIENT_OPTIONS = {
	url: process.env.TEST_NODE_ENDPOINT
};

export const TEST_SEED_1 = Bip39.mnemonicToSeed(process.env.TEST_MNEMONIC);
export const TEST_SEED_2 = Bip39.mnemonicToSeed(process.env.TEST_2_MNEMONIC);
export const TEST_NODE_SEED = Bip39.mnemonicToSeed(process.env.TEST_NODE_MNEMONIC);
export const TEST_COIN_TYPE = Number.parseInt(process.env.TEST_COIN_TYPE, 10);

// Initialize schema for entity storage
initSchema();

// Setup entity storage connectors
EntityStorageConnectorFactory.register(
	"vault-key",
	() =>
		new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		})
);

const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
	entitySchema: nameof<VaultSecret>()
});
EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

// Setup vault connector
export const TEST_VAULT_CONNECTOR = new EntityStorageVaultConnector();
VaultConnectorFactory.register("vault", () => TEST_VAULT_CONNECTOR);

const userAddresses0 = Iota.getAddresses(
	Bip39.mnemonicToSeed(process.env.TEST_MNEMONIC),
	TEST_COIN_TYPE,
	0,
	0,
	1
);
const userAddresses1 = Iota.getAddresses(
	Bip39.mnemonicToSeed(process.env.TEST_2_MNEMONIC),
	TEST_COIN_TYPE,
	0,
	0,
	1
);
const nodeAddresses = Iota.getAddresses(
	Bip39.mnemonicToSeed(process.env.TEST_NODE_MNEMONIC),
	TEST_COIN_TYPE,
	0,
	0,
	1
);
export const USER_ADDRESS_0 = userAddresses0[0];
export const USER_ADDRESS_1 = userAddresses1[0];
export const NODE_ADDRESS = nodeAddresses[0];

// Store mnemonics in vault for node identity
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_NODE_IDENTITY}/${TEST_MNEMONIC_NAME}`,
	process.env.TEST_NODE_MNEMONIC
);

// Store mnemonics in vault for user identity 0
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_USER_IDENTITY_0}/${TEST_MNEMONIC_NAME}`,
	process.env.TEST_MNEMONIC
);

// Store mnemonics in vault for user identity 1
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_USER_IDENTITY_1}/${TEST_MNEMONIC_NAME}`,
	process.env.TEST_2_MNEMONIC
);

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	console.debug(
		"Test Address Node",
		`${TEST_EXPLORER_URL}address/${NODE_ADDRESS}?network=${TEST_NETWORK}`
	);
	console.debug(
		"Test Address User 0",
		`${TEST_EXPLORER_URL}address/${USER_ADDRESS_0}?network=${TEST_NETWORK}`
	);
	console.debug(
		"Test Address User 1",
		`${TEST_EXPLORER_URL}address/${USER_ADDRESS_1}?network=${TEST_NETWORK}`
	);

	try {
		// Request IOTA from the faucet
		await requestIotaFromFaucetV0({
			host: TEST_FAUCET_ENDPOINT,
			recipient: NODE_ADDRESS
		});
		await requestIotaFromFaucetV0({
			host: TEST_FAUCET_ENDPOINT,
			recipient: USER_ADDRESS_0
		});
		await requestIotaFromFaucetV0({
			host: TEST_FAUCET_ENDPOINT,
			recipient: USER_ADDRESS_1
		});
	} catch {}
}

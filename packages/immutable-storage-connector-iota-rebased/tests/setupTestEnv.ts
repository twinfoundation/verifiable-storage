// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { requestIotaFromFaucetV0 } from "@iota/iota-sdk/faucet";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Guards, Is } from "@twin.org/core";
import { Bip39, Bip44, KeyType } from "@twin.org/crypto";
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
         npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_`
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
export const TEST_USER_IDENTITY_ID = "test-user-identity";
export const TEST_USER_MNEMONIC_NAME = "test-user-mnemonic";
export const TEST_NODE_MNEMONIC_NAME = "test-node-mnemonic";
export const DEV_TEST_NETWORK = "?network=devnet";
export const TEST_NETWORK = "?network=testnet";
export const TEST_FAUCET_ENDPOINT = process.env.TEST_FAUCET_ENDPOINT ?? "";
export const TEST_CLIENT_OPTIONS = {
	url: process.env.TEST_NODE_ENDPOINT
};

export const TEST_SEED = Bip39.mnemonicToSeed(process.env.TEST_MNEMONIC);
export const TEST_2_SEED = Bip39.mnemonicToSeed(process.env.TEST_2_MNEMONIC);
export const TEST_NODE_SEED = Bip39.mnemonicToSeed(process.env.TEST_NODE_MNEMONIC);
export const TEST_COIN_TYPE = Number.parseInt(process.env.TEST_COIN_TYPE ?? "784", 10);

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

// Generate test address
const bip44KeyPair = Bip44.keyPair(TEST_2_SEED, KeyType.Ed25519, TEST_COIN_TYPE, 0, false, 0);
const keypair = Ed25519Keypair.fromSecretKey(bip44KeyPair.privateKey);
export const TEST_ADDRESS = keypair.getPublicKey().toIotaAddress();

// Generate node address
const nodeBip44KeyPair = Bip44.keyPair(
	TEST_NODE_SEED,
	KeyType.Ed25519,
	TEST_COIN_TYPE,
	0,
	false,
	0
);
const nodeKeypair = Ed25519Keypair.fromSecretKey(nodeBip44KeyPair.privateKey);
export const NODE_ADDRESS = nodeKeypair.getPublicKey().toIotaAddress();

// Store mnemonics in vault for node identity
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_NODE_IDENTITY}/${TEST_NODE_MNEMONIC_NAME}`,
	process.env.TEST_NODE_MNEMONIC
);

// Store mnemonics in vault for user identity
await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_USER_IDENTITY_ID}/${TEST_USER_MNEMONIC_NAME}`,
	process.env.TEST_2_MNEMONIC
);

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	console.debug(
		"Test Address",
		`${process.env.TEST_EXPLORER_URL}address/${TEST_ADDRESS}${DEV_TEST_NETWORK}`
	);
	// Request IOTA from the faucet
	await requestIotaFromFaucetV0({
		host: process.env.TEST_FAUCET_ENDPOINT ?? "https://faucet.devnet.iota.cafe",
		recipient: NODE_ADDRESS
	});
	await requestIotaFromFaucetV0({
		host: process.env.TEST_FAUCET_ENDPOINT ?? "https://faucet.devnet.iota.cafe",
		recipient: TEST_ADDRESS
	});
}

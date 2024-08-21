// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseError, Converter, GeneralError, Guards, Is, Urn, type IError } from "@gtsc/core";
import { Bip39 } from "@gtsc/crypto";
import type { IImmutableStorageConnector } from "@gtsc/immutable-storage-models";
import { nameof } from "@gtsc/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@gtsc/vault-models";
import { WalletConnectorFactory, type IWalletConnector } from "@gtsc/wallet-models";
import {
	AddressUnlockCondition,
	BasicOutput,
	Client,
	CoinType,
	Ed25519Address,
	FeatureType,
	MetadataFeature,
	UTXOInput,
	Utils,
	type BasicOutputBuilderParams,
	type Block,
	type IBuildBlockOptions,
	type TransactionPayload
} from "@iota/sdk-wasm/node/lib/index.js";
import type { IIotaImmutableStorageConnectorConfig } from "./models/IIotaImmutableStorageConnectorConfig";

/**
 * Class for performing immutable storage operations on IOTA.
 */
export class IotaImmutableStorageConnector implements IImmutableStorageConnector {
	/**
	 * The namespace supported by the immutable storage connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * Default name for the seed secret.
	 * @internal
	 */
	private static readonly _DEFAULT_SEED_SECRET_NAME: string = "seed";

	/**
	 * Default name for the mnemonic secret.
	 * @internal
	 */
	private static readonly _DEFAULT_MNEMONIC_SECRET_NAME: string = "mnemonic";

	/**
	 * The default length of time to wait for the inclusion of a transaction in seconds.
	 * @internal
	 */
	private static readonly _DEFAULT_INCLUSION_TIMEOUT: number = 60;

	/**
	 * Default coin type.
	 * @internal
	 */
	private static readonly _DEFAULT_COIN_TYPE: number = CoinType.IOTA;

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaImmutableStorageConnector>();

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * Connector for wallet operations.
	 * @internal
	 */
	private readonly _walletConnector: IWalletConnector;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaImmutableStorageConnectorConfig;

	/**
	 * Create a new instance of IotaImmutableStorageConnector.
	 * @param options The options for the connector.
	 * @param options.vaultConnectorType The type of the vault connector, defaults to "vault".
	 * @param options.walletConnectorType The type of the wallet connector, defaults to "wallet".
	 * @param options.config The configuration for the connector.
	 */
	constructor(options: {
		vaultConnectorType?: string;
		walletConnectorType?: string;
		config: IIotaImmutableStorageConnectorConfig;
	}) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaImmutableStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaImmutableStorageConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");
		this._walletConnector = WalletConnectorFactory.get(options.walletConnectorType ?? "wallet");

		this._config = options.config;
		this._config.vaultMnemonicId ??= IotaImmutableStorageConnector._DEFAULT_MNEMONIC_SECRET_NAME;
		this._config.vaultSeedId ??= IotaImmutableStorageConnector._DEFAULT_SEED_SECRET_NAME;
		this._config.coinType ??= IotaImmutableStorageConnector._DEFAULT_COIN_TYPE;
		this._config.inclusionTimeoutSeconds ??=
			IotaImmutableStorageConnector._DEFAULT_INCLUSION_TIMEOUT;
	}

	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in urn format.
	 */
	public async store(controller: string, data: Uint8Array): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			const walletAddresses = await this._walletConnector.getAddresses(
				controller,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			const buildParams: BasicOutputBuilderParams = {
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(walletAddresses[0])))
				],
				features: [new MetadataFeature(Converter.bytesToHex(data, true))]
			};

			const client = new Client(this._config.clientOptions);

			const basicOutput = await client.buildBasicOutput(buildParams);

			const blockDetails = await this.prepareAndPostTransaction(controller, client, {
				outputs: [basicOutput]
			});

			const transactionId = Utils.transactionId(blockDetails.block.payload as TransactionPayload);

			const hrp = await client.getBech32Hrp();

			return `immutable:${new Urn(IotaImmutableStorageConnector.NAMESPACE, `${hrp}:${transactionId}`).toString()}`;
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"storingFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get an immutable item.
	 * @param id The id of the item to get.
	 * @returns The data for the item.
	 */
	public async get(id: string): Promise<Uint8Array> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IotaImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const immutableItemParts = urnParsed.namespaceSpecificParts(1);

			const immutableItemId = immutableItemParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "immutableItemId", immutableItemId, 64, true);

			const basicOutputResponse = await client.getOutput(`${immutableItemId}0000`);
			const basicOutput = basicOutputResponse.output as BasicOutput;

			const metadataFeatures = basicOutput.features?.filter(f => f.type === FeatureType.Metadata);

			const metadata = Is.arrayValue(metadataFeatures)
				? Converter.hexToBytes((metadataFeatures[0] as MetadataFeature).data)
				: new Uint8Array();

			return metadata;
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"gettingFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Remove the item from immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the immutable item to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const immutableParts = urnParsed.namespaceSpecificParts(1);

			const immutableItemId = immutableParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "immutableItemId", immutableItemId, 64, true);

			const basicOutputResponse = await client.getOutput(`${immutableItemId}0000`);

			const walletAddresses = await this._walletConnector.getAddresses(
				controller,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			await this.prepareAndPostTransaction(controller, client, {
				inputs: [
					new UTXOInput(
						basicOutputResponse.metadata.transactionId,
						basicOutputResponse.metadata.outputIndex
					)
				],
				outputs: [
					new BasicOutput(basicOutputResponse.output.getAmount(), [
						new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(walletAddresses[0])))
					])
				]
			});
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"removingFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Prepare a transaction for sending, post and wait for inclusion.
	 * @param controller The identity of the user to access the vault keys.
	 * @param client The client to use.
	 * @param options The options for the transaction.
	 * @returns The block id and block.
	 * @internal
	 */
	private async prepareAndPostTransaction(
		controller: string,
		client: Client,
		options: IBuildBlockOptions
	): Promise<{ blockId: string; block: Block }> {
		const seed = await this.getSeed(controller);
		const secretManager = { hexSeed: Converter.bytesToHex(seed, true) };

		const prepared = await client.prepareTransaction(secretManager, {
			coinType: this._config.coinType ?? IotaImmutableStorageConnector._DEFAULT_COIN_TYPE,
			...options
		});

		const signed = await client.signTransaction(secretManager, prepared);

		const blockIdAndBlock = await client.postBlockPayload(signed);

		try {
			const timeoutSeconds =
				this._config.inclusionTimeoutSeconds ??
				IotaImmutableStorageConnector._DEFAULT_INCLUSION_TIMEOUT;

			await client.retryUntilIncluded(blockIdAndBlock[0], 2, Math.ceil(timeoutSeconds / 2));
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"inclusionFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}

		return {
			blockId: blockIdAndBlock[0],
			block: blockIdAndBlock[1]
		};
	}

	/**
	 * Get the seed from the vault.
	 * @returns The seed.
	 * @internal
	 */
	private async getSeed(controller: string): Promise<Uint8Array> {
		try {
			const seedBase64 = await this._vaultConnector.getSecret<string>(
				this.buildSeedKey(controller)
			);
			return Converter.base64ToBytes(seedBase64);
		} catch {}

		const mnemonic = await this._vaultConnector.getSecret<string>(
			this.buildMnemonicKey(controller)
		);

		return Bip39.mnemonicToSeed(mnemonic);
	}

	/**
	 * Extract error from SDK payload.
	 * @param error The error to extract.
	 * @returns The extracted error.
	 */
	private extractPayloadError(error: unknown): IError {
		if (Is.json(error)) {
			const obj = JSON.parse(error);
			const message = obj.payload?.error;
			if (message === "no input with matching ed25519 address provided") {
				return new GeneralError(this.CLASS_NAME, "insufficientFunds");
			}
			return {
				name: "IOTA",
				message
			};
		}

		return BaseError.fromError(error);
	}

	/**
	 * Build the key name to access the mnemonic in the vault.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The vault key.
	 * @internal
	 */
	private buildMnemonicKey(identity: string): string {
		return `${identity}/${this._config.vaultMnemonicId ?? IotaImmutableStorageConnector._DEFAULT_MNEMONIC_SECRET_NAME}`;
	}

	/**
	 * Build the key name to access the seed in the vault.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The vault key.
	 * @internal
	 */
	private buildSeedKey(identity: string): string {
		return `${identity}/${this._config.vaultSeedId ?? IotaImmutableStorageConnector._DEFAULT_SEED_SECRET_NAME}`;
	}
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	AddressUnlockCondition,
	BasicOutput,
	Client,
	Ed25519Address,
	FeatureType,
	MetadataFeature,
	UTXOInput,
	Utils,
	type BasicOutputBuilderParams,
	type TransactionPayload
} from "@iota/sdk-wasm/node/lib/index.js";
import { Converter, GeneralError, Guards, Is, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { IotaStardust } from "@twin.org/dlt-iota-stardust";
import {
	ImmutableStorageContexts,
	type IImmutableStorageConnector
} from "@twin.org/immutable-storage-models";
import { nameof } from "@twin.org/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import type { IImmutableStorageIotaStardustReceipt } from "./models/IImmutableStorageIotaStardustReceipt";
import type { IIotaStardustImmutableStorageConnectorConfig } from "./models/IIotaStardustImmutableStorageConnectorConfig";
import type { IIotaStardustImmutableStorageConnectorConstructorOptions } from "./models/IIotaStardustImmutableStorageConnectorConstructorOptions";
import { IotaStardustImmutableStorageTypes } from "./models/iotaStardustImmutableStorageTypes";

/**
 * Class for performing immutable storage operations on IOTA Stardust.
 */
export class IotaStardustImmutableStorageConnector implements IImmutableStorageConnector {
	/**
	 * The namespace supported by the immutable storage connector.
	 */
	public static readonly NAMESPACE: string = "iota-stardust";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaStardustImmutableStorageConnector>();

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaStardustImmutableStorageConnectorConfig;

	/**
	 * Create a new instance of IotaStardustImmutableStorageConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaStardustImmutableStorageConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaStardustImmutableStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaStardustImmutableStorageConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");

		this._config = options.config;
		IotaStardust.populateConfig(this._config);
	}

	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in urn format and the receipt.
	 */
	public async store(
		controller: string,
		data: Uint8Array
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			const walletAddresses = await IotaStardust.getAddresses(
				this._config,
				this._vaultConnector,
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

			const blockDetails = await IotaStardust.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controller,
				client,
				{
					outputs: [basicOutput]
				}
			);

			const transactionPayload = blockDetails.block.payload as TransactionPayload;

			const transactionId = Utils.transactionId(transactionPayload);

			const hrp = await client.getBech32Hrp();

			const basicOutputResponse = await client.getOutput(`${transactionId}0000`);

			const receipt: IImmutableStorageIotaStardustReceipt = {
				"@context": ImmutableStorageContexts.ContextRoot,
				type: IotaStardustImmutableStorageTypes.IotaReceipt,
				milestoneIndexBooked: basicOutputResponse.metadata.milestoneIndexBooked,
				milestoneTimestampBooked: basicOutputResponse.metadata.milestoneTimestampBooked,
				network: hrp,
				transactionId
			};

			return {
				id: `immutable:${new Urn(IotaStardustImmutableStorageConnector.NAMESPACE, [hrp, transactionId]).toString()}`,
				receipt: receipt as unknown as IJsonLdNodeObject
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"storingFailed",
				undefined,
				IotaStardust.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get an immutable item.
	 * @param id The id of the item to get.
	 * @param options Additional options for getting the item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @returns The data for the item and the receipt.
	 */
	public async get(
		id: string,
		options?: { includeData?: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IotaStardustImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaStardustImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const immutableItemParts = urnParsed.namespaceSpecificParts(1);

			const hrp = immutableItemParts[0];
			const immutableTransactionId = immutableItemParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "immutableItemId", immutableTransactionId, 64, true);

			const basicOutputResponse = await client.getOutput(`${immutableTransactionId}0000`);
			const basicOutput = basicOutputResponse.output as BasicOutput;

			const receipt: IImmutableStorageIotaStardustReceipt = {
				"@context": ImmutableStorageContexts.ContextRoot,
				type: IotaStardustImmutableStorageTypes.IotaReceipt,
				milestoneIndexBooked: basicOutputResponse.metadata.milestoneIndexBooked,
				milestoneTimestampBooked: basicOutputResponse.metadata.milestoneTimestampBooked,
				network: hrp,
				transactionId: immutableTransactionId
			};

			let data: Uint8Array | undefined;
			if (options?.includeData ?? true) {
				const metadataFeatures = basicOutput.features?.filter(f => f.type === FeatureType.Metadata);

				data = Is.arrayValue(metadataFeatures)
					? Converter.hexToBytes((metadataFeatures[0] as MetadataFeature).data)
					: new Uint8Array();
			}

			return {
				receipt: receipt as unknown as IJsonLdNodeObject,
				data
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"gettingFailed",
				undefined,
				IotaStardust.extractPayloadError(error)
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
		if (urnParsed.namespaceMethod() !== IotaStardustImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaStardustImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const immutableParts = urnParsed.namespaceSpecificParts(1);

			const immutableTransactionId = immutableParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "immutableItemId", immutableTransactionId, 64, true);

			const basicOutputResponse = await client.getOutput(`${immutableTransactionId}0000`);

			const walletAddresses = await IotaStardust.getAddresses(
				this._config,
				this._vaultConnector,
				controller,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			await IotaStardust.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controller,
				client,
				{
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
				}
			);
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"removingFailed",
				undefined,
				IotaStardust.extractPayloadError(error)
			);
		}
	}
}

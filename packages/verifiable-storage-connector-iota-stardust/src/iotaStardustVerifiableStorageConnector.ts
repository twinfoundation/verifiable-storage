// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	AddressUnlockCondition,
	BasicOutput,
	Client,
	Ed25519Address,
	GovernorAddressUnlockCondition,
	StateControllerAddressUnlockCondition,
	Utils,
	UTXOInput,
	type AliasOutput,
	type AliasOutputBuilderParams,
	type TransactionPayload
} from "@iota/sdk-wasm/node/lib/index.js";
import { Converter, GeneralError, Guards, Is, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { IotaStardust } from "@twin.org/dlt-iota-stardust";
import { nameof } from "@twin.org/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import {
	VerifiableStorageContexts,
	type IVerifiableStorageConnector
} from "@twin.org/verifiable-storage-models";
import type { IIotaStardustVerifiableStorageConnectorConfig } from "./models/IIotaStardustVerifiableStorageConnectorConfig";
import type { IIotaStardustVerifiableStorageConnectorConstructorOptions } from "./models/IIotaStardustVerifiableStorageConnectorConstructorOptions";
import { IotaStardustVerifiableStorageTypes } from "./models/iotaStardustVerifiableStorageTypes";
import type { IVerifiableStorageIotaStardustReceipt } from "./models/IVerifiableStorageIotaStardustReceipt";

/**
 * Class for performing verifiable storage operations on IOTA Stardust.
 */
export class IotaStardustVerifiableStorageConnector implements IVerifiableStorageConnector {
	/**
	 * The namespace supported by the verifiable storage connector.
	 */
	public static readonly NAMESPACE: string = "iota-stardust";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaStardustVerifiableStorageConnector>();

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaStardustVerifiableStorageConnectorConfig;

	/**
	 * Create a new instance of IotaStardustVerifiableStorageConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaStardustVerifiableStorageConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaStardustVerifiableStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaStardustVerifiableStorageConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");

		this._config = options.config;
		IotaStardust.populateConfig(this._config);
	}

	/**
	 * Create an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored verifiable item in urn format.
	 */
	public async create(
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

			const walletAddress = new Ed25519Address(Utils.bech32ToHex(walletAddresses[0]));

			const client = new Client(this._config.clientOptions);

			const buildParams: AliasOutputBuilderParams = {
				aliasId: "0x0000000000000000000000000000000000000000000000000000000000000000",
				unlockConditions: [
					new StateControllerAddressUnlockCondition(walletAddress),
					new GovernorAddressUnlockCondition(walletAddress)
				],
				stateMetadata: Converter.bytesToHex(data, true)
			};

			const aliasOutput = await client.buildAliasOutput(buildParams);

			const blockDetails = await IotaStardust.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controller,
				client,
				{
					outputs: [aliasOutput]
				}
			);

			const transactionPayload = blockDetails.block.payload as TransactionPayload;
			const transactionId = Utils.transactionId(transactionPayload);
			const hrp = await client.getBech32Hrp();

			const aliasOutputResponse = await client.getOutput(`${transactionId}0000`);
			const aliasId = Utils.computeAliasId(`${transactionId}0000`);

			const receipt: IVerifiableStorageIotaStardustReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: IotaStardustVerifiableStorageTypes.IotaReceipt,
				milestoneIndexBooked: aliasOutputResponse.metadata.milestoneIndexBooked,
				milestoneTimestampBooked: aliasOutputResponse.metadata.milestoneTimestampBooked,
				network: hrp,
				aliasId
			};

			return {
				id: `verifiable:${new Urn(IotaStardustVerifiableStorageConnector.NAMESPACE, [hrp, aliasId]).toString()}`,
				receipt: receipt as unknown as IJsonLdNodeObject
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"creatingFailed",
				undefined,
				IotaStardust.extractPayloadError(error)
			);
		}
	}

	/**
	 * Update an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the item to update.
	 * @param data The data to store.
	 * @returns The updated receipt.
	 */
	public async update(
		controller: string,
		id: string,
		data: Uint8Array
	): Promise<IJsonLdNodeObject> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IotaStardustVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaStardustVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const verifiableItemParts = urnParsed.namespaceSpecificParts(1);

			const hrp = verifiableItemParts[0];
			const aliasId = verifiableItemParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "verifiableItemId", aliasId, 64, true);

			const aliasOutputId = await client.aliasOutputId(aliasId);
			const aliasOutputResponse = await client.getOutput(aliasOutputId);
			const aliasOutput = aliasOutputResponse.output as AliasOutput;

			const buildParams: AliasOutputBuilderParams = {
				aliasId,
				unlockConditions: aliasOutput.unlockConditions,
				stateIndex: aliasOutput.stateIndex + 1,
				stateMetadata: Converter.bytesToHex(data, true),
				foundryCounter: aliasOutput.foundryCounter,
				immutableFeatures: aliasOutput.immutableFeatures,
				features: aliasOutput.features
			};

			const updatedAliasOutput = await client.buildAliasOutput(buildParams);

			await IotaStardust.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controller,
				client,
				{
					outputs: [updatedAliasOutput]
				}
			);

			const receipt: IVerifiableStorageIotaStardustReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: IotaStardustVerifiableStorageTypes.IotaReceipt,
				milestoneIndexBooked: aliasOutputResponse.metadata.milestoneIndexBooked,
				milestoneTimestampBooked: aliasOutputResponse.metadata.milestoneTimestampBooked,
				network: hrp,
				aliasId
			};

			return receipt as unknown as IJsonLdNodeObject;
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"updatingFailed",
				undefined,
				IotaStardust.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get a verifiable item.
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

		if (urnParsed.namespaceMethod() !== IotaStardustVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaStardustVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const verifiableItemParts = urnParsed.namespaceSpecificParts(1);

			const hrp = verifiableItemParts[0];
			const aliasId = verifiableItemParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "verifiableItemId", aliasId, 64, true);

			const aliasOutputId = await client.aliasOutputId(aliasId);
			const aliasOutputResponse = await client.getOutput(aliasOutputId);
			const aliasOutput = aliasOutputResponse.output as AliasOutput;

			const receipt: IVerifiableStorageIotaStardustReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: IotaStardustVerifiableStorageTypes.IotaReceipt,
				milestoneIndexBooked: aliasOutputResponse.metadata.milestoneIndexBooked,
				milestoneTimestampBooked: aliasOutputResponse.metadata.milestoneTimestampBooked,
				network: hrp,
				aliasId
			};

			let data: Uint8Array | undefined;
			if ((options?.includeData ?? true) && !Is.undefined(aliasOutput.stateMetadata)) {
				data = Converter.hexToBytes(aliasOutput.stateMetadata);
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
	 * Remove the item from verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the verifiable item to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaStardustVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaStardustVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const verifiableItemParts = urnParsed.namespaceSpecificParts(1);

			const aliasId = verifiableItemParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "verifiableItemId", aliasId, 64, true);

			const aliasOutputId = await client.aliasOutputId(aliasId);
			const aliasOutputResponse = await client.getOutput(aliasOutputId);

			const walletAddresses = await IotaStardust.getAddresses(
				this._config,
				this._vaultConnector,
				controller,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			const walletAddress = new Ed25519Address(Utils.bech32ToHex(walletAddresses[0]));

			await IotaStardust.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controller,
				client,
				{
					burn: {
						aliases: [aliasId]
					},
					inputs: [
						new UTXOInput(
							aliasOutputResponse.metadata.transactionId,
							aliasOutputResponse.metadata.outputIndex
						)
					],
					outputs: [
						new BasicOutput(aliasOutputResponse.output.getAmount(), [
							new AddressUnlockCondition(walletAddress)
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

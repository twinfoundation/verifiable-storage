// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClient } from "@iota/iota-sdk/client";
import { Transaction } from "@iota/iota-sdk/transactions";
import { BaseError, Converter, GeneralError, Guards, Is, StringHelper, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { IotaRebased } from "@twin.org/dlt-iota-rebased";
import {
	ImmutableStorageTypes,
	type IImmutableStorageConnector
} from "@twin.org/immutable-storage-models";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import compiledModulesJson from "./contracts/compiledModules/compiled-modules.json";
import type { IIotaRebasedImmutableStorageConnectorConfig } from "./models/IIotaRebasedImmutableStorageConnectorConfig";
import type { IIotaRebasedImmutableStorageConnectorConstructorOptions } from "./models/IIotaRebasedImmutableStorageConnectorConstructorOptions";
import { IotaRebasedImmutableStorageTypes } from "./models/iotaRebasedImmutableStorageTypes";

/**
 * Class for performing immutable storage operations on IOTA Rebased.
 */
export class IotaRebasedImmutableStorageConnector implements IImmutableStorageConnector {
	/**
	 * The namespace supported by the storage connector.
	 */
	public static readonly NAMESPACE: string = "iota-rebased";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaRebasedImmutableStorageConnector>();

	/**
	 * The vault connector.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The gas budget to use for the transaction.
	 * @internal
	 */
	private readonly _gasBudget: number;

	/**
	 * The configuration to use for IOTA Rebased operations.
	 * @internal
	 */
	private readonly _config: IIotaRebasedImmutableStorageConnectorConfig;

	/**
	 * The IOTA Rebased client.
	 * @internal
	 */
	private readonly _client: IotaClient;

	/**
	 * The name of the contract to use.
	 * @internal
	 */
	private readonly _contractName: string;

	/**
	 * The package ID of the deployed storage Move module.
	 * @internal
	 */
	private _packageId: string | undefined;

	/**
	 * Create a new instance of IotaRebasedImmutableStorageConnector.
	 * @param options The options for the storage connector.
	 */
	constructor(options: IIotaRebasedImmutableStorageConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaRebasedImmutableStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.network), options.config.network);
		this._vaultConnector = VaultConnectorFactory.get(options?.vaultConnectorType ?? "vault");

		this._config = options.config;

		this._contractName = this._config.contractName ?? "immutable-storage";
		Guards.stringValue(this.CLASS_NAME, nameof(this._contractName), this._contractName);

		this._gasBudget = this._config.gasBudget ?? 1_000_000_000;
		Guards.number(this.CLASS_NAME, nameof(this._gasBudget), this._gasBudget);
		if (this._gasBudget <= 0) {
			throw new GeneralError(this.CLASS_NAME, "invalidGasBudget", {
				gasBudget: this._gasBudget
			});
		}

		IotaRebased.populateConfig(this._config);
		this._client = IotaRebased.createClient(this._config);
	}

	/**
	 * Bootstrap the Immutable Storage contract.
	 * @param nodeIdentity The identity of the node.
	 * @param nodeLoggingConnectorType The node logging connector type, defaults to "node-logging".
	 * @returns True if the bootstrapping process was successful.
	 */
	public async start(
		nodeIdentity: string,
		nodeLoggingConnectorType?: string,
		componentState?: { [id: string]: unknown }
	): Promise<void> {
		const nodeLogging = LoggingConnectorFactory.getIfExists(
			nodeLoggingConnectorType ?? "node-logging"
		);
		try {
			const contractData =
				compiledModulesJson[this._contractName as keyof typeof compiledModulesJson];

			if (!contractData) {
				throw new GeneralError(this.CLASS_NAME, "contractDataNotFound", {
					contractName: this._contractName
				});
			}

			// Convert base64 package(s) to bytes
			let compiledModules: number[][];

			if (Is.arrayValue<string>(contractData.package)) {
				compiledModules = contractData.package.map((pkg: string) =>
					Array.from(Converter.base64ToBytes(pkg))
				);
			} else {
				compiledModules = [Array.from(Converter.base64ToBytes(contractData.package))];
			}

			if (Is.stringValue(componentState?.packageId)) {
				this._packageId = componentState.packageId;

				// Check if package exists on the network
				const packageExists = await IotaRebased.packageExistsOnNetwork(
					this._client,
					this._packageId
				);
				if (packageExists) {
					await nodeLogging?.log({
						level: "info",
						source: this.CLASS_NAME,
						ts: Date.now(),
						message: "contractAlreadyDeployed",
						data: {
							network: this._config.network,
							nodeIdentity,
							packageId: this._packageId
						}
					});
				}
			}

			// Package does not exist, proceed to deploy
			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "contractDeploymentStarted",
				data: {
					network: this._config.network,
					nodeIdentity
				}
			});

			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			// Publish the compiled modules
			const [upgradeCap] = txb.publish({
				modules: compiledModules,
				dependencies: ["0x1", "0x2"]
			});

			const controllerAddress = await this.getControllerAddress(nodeIdentity);

			// Transfer the upgrade capability to the controller
			txb.transferObjects([upgradeCap], txb.pure.address(controllerAddress));

			const result = await IotaRebased.prepareAndPostStorageTransaction(
				this._config,
				this._vaultConnector,
				nodeIdentity,
				this._client,
				{
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "deployTransactionFailed", {
					error: result.effects?.status?.error
				});
			}

			// Find the package object (owner field will be Immutable)
			const packageObject = result.effects?.created?.find(obj => obj.owner === "Immutable");

			const packageId = packageObject?.reference?.objectId;
			if (!packageId) {
				throw new GeneralError(this.CLASS_NAME, "packageIdNotFound", {
					packageId
				});
			}

			this._packageId = packageId;

			if (componentState) {
				componentState.packageId = this._packageId;
			}

			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "contractDeploymentCompleted",
				data: {
					packageId: this._packageId
				}
			});
		} catch (error) {
			await nodeLogging?.log({
				level: "error",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "startFailed",
				error: BaseError.fromError(error),
				data: {
					network: this._config.network,
					nodeIdentity
				}
			});

			throw error;
		}
	}

	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in URN format and the receipt.
	 */
	public async store(
		controller: string,
		data: Uint8Array
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		this.ensureStarted();
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const packageId = this._packageId;
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::store_data`,
				arguments: [txb.pure.string(Converter.bytesToHex(data))]
			});

			const result = await IotaRebased.prepareAndPostStorageTransaction(
				this._config,
				this._vaultConnector,
				controller,
				this._client,
				{
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "storingTransactionFailed", {
					error: result.effects?.status?.error
				});
			}

			const storageEvent = result.events?.find(event =>
				event.type.includes("immutable_storage::StorageCreated")
			);

			const parsedJson = storageEvent?.parsedJson as { id: string };

			const objectId = parsedJson?.id;

			if (!objectId) {
				throw new GeneralError(this.CLASS_NAME, "objectIdNotFound", {
					namespace: IotaRebasedImmutableStorageConnector.NAMESPACE,
					id: objectId
				});
			}

			const receipt = {
				"@context": ImmutableStorageTypes.ContextRoot,
				type: IotaRebasedImmutableStorageTypes.IotaRebasedReceipt,
				timestamp: Number(storageEvent?.timestampMs ?? Date.now())
			};

			const urn = new Urn(
				"immutable",
				`${IotaRebasedImmutableStorageConnector.NAMESPACE}:${objectId}`
			);

			return {
				id: urn.toString(),
				receipt: receipt as IJsonLdNodeObject
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"storingFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
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
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const includeData = options?.includeData ?? true;
		const objectId = this.extractObjectId(id);

		try {
			const objectData = await this._client.getObject({
				id: objectId,
				options: {
					showContent: true
				}
			});

			if (!objectData.data?.content) {
				throw new GeneralError(this.CLASS_NAME, "objectNotFound");
			}

			const parsedData = objectData.data.content as unknown as {
				fields: {
					data: string;
					timestamp: string;
					creator: string;
				};
			};

			const fields = parsedData.fields;

			const receipt = {
				"@context": ImmutableStorageTypes.ContextRoot,
				type: IotaRebasedImmutableStorageTypes.IotaRebasedReceipt,
				timestamp: Number(fields.timestamp)
			};

			let dataResult: Uint8Array | undefined;

			if (includeData) {
				const hexString = fields.data;
				dataResult = Converter.hexToBytes(hexString);
			}

			return {
				data: dataResult,
				receipt: receipt as IJsonLdNodeObject
			};
		} catch (error) {
			if (error instanceof GeneralError) {
				throw error;
			} else {
				throw new GeneralError(
					this.CLASS_NAME,
					"gettingFailed",
					undefined,
					IotaRebased.extractPayloadError(error)
				);
			}
		}
	}

	/**
	 * Remove the item from immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the immutable item to remove in URN format.
	 * @returns A promise that resolves when the item is removed.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		this.ensureStarted();
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IotaRebasedImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaRebasedImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = this.extractObjectId(id);

			const packageId = this._packageId;
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::delete_data`,
				arguments: [txb.object(objectId)]
			});

			const result = await IotaRebased.prepareAndPostNftTransaction(
				this._config,
				this._vaultConnector,
				controller,
				this._client,
				{
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "removingTransactionFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"removingFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get the controller's address.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The controller's address.
	 * @internal
	 */
	private async getControllerAddress(identity: string): Promise<string> {
		const seed = await IotaRebased.getSeed(this._config, this._vaultConnector, identity);
		const walletAddressIndex = this._config.walletAddressIndex ?? 0;
		const addresses = IotaRebased.getAddresses(
			seed,
			this._config.coinType ?? IotaRebased.DEFAULT_COIN_TYPE,
			0,
			walletAddressIndex,
			1,
			false
		);

		return addresses[0];
	}

	/**
	 * Extract the object ID from an immutable storage URN.
	 * @param id The immutable storage URN.
	 * @returns The object ID.
	 * @internal
	 */
	private extractObjectId(id: string): string {
		const urn = Urn.fromValidString(id);
		const parts = urn.namespaceSpecificParts();
		if (parts.length !== 2) {
			throw new GeneralError(this.CLASS_NAME, "invalidIdFormat", {
				id
			});
		}
		return parts[1];
	}

	/**
	 * Ensure that the connector is bootstrapped.
	 * @returns void
	 * @internal
	 */
	private ensureStarted(): void {
		if (!this._packageId) {
			throw new GeneralError(this.CLASS_NAME, "connectorNotStarted", {
				packageId: this._packageId
			});
		}
	}

	/**
	 * Get the module name based on the contract name.
	 * @returns The module name in snake_case.
	 * @internal
	 */
	private getModuleName(): string {
		return StringHelper.snakeCase(this._contractName);
	}
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClient } from "@iota/iota-sdk/client";
import { Transaction } from "@iota/iota-sdk/transactions";
import {
	BaseError,
	Converter,
	GeneralError,
	Guards,
	Is,
	StringHelper,
	UnauthorizedError,
	Urn
} from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { Iota } from "@twin.org/dlt-iota";
import { LoggingConnectorFactory, type ILoggingConnector } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import {
	VerifiableStorageContexts,
	type IVerifiableStorageConnector
} from "@twin.org/verifiable-storage-models";
import compiledModulesJson from "./contracts/compiledModules/compiled-modules.json";
import { IotaVerifiableStorageUtils } from "./iotaVerifiableStorageUtils";
import type { IIotaVerifiableStorageConnectorConfig } from "./models/IIotaVerifiableStorageConnectorConfig";
import type { IIotaVerifiableStorageConnectorConstructorOptions } from "./models/IIotaVerifiableStorageConnectorConstructorOptions";
import { IotaVerifiableStorageTypes } from "./models/iotaVerifiableStorageTypes";
import type { IVerifiableStorageIotaReceipt } from "./models/IVerifiableStorageIotaReceipt";

/**
 * Class for performing verifiable storage operations on IOTA.
 */
export class IotaVerifiableStorageConnector implements IVerifiableStorageConnector {
	/**
	 * The namespace supported by the storage connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * The default maximum size of the allow list.
	 * @internal
	 */
	private static readonly _DEFAULT_ALLOW_LIST_SIZE: number = 100;

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaVerifiableStorageConnector>();

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
	 * The configuration to use for IOTA operations.
	 * @internal
	 */
	private readonly _config: IIotaVerifiableStorageConnectorConfig;

	/**
	 * The IOTA client.
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
	private _deployedPackageId: string | undefined;

	/**
	 * The logging connector.
	 * @internal
	 */
	private readonly _logging?: ILoggingConnector;

	/**
	 * Create a new instance of IotaVerifiableStorageConnector.
	 * @param options The options for the storage connector.
	 */
	constructor(options: IIotaVerifiableStorageConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaVerifiableStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.network), options.config.network);
		this._vaultConnector = VaultConnectorFactory.get(options?.vaultConnectorType ?? "vault");

		this._logging = LoggingConnectorFactory.getIfExists(options?.loggingConnectorType ?? "logging");

		this._config = options.config;

		this._contractName = this._config.contractName ?? "verifiable-storage";
		Guards.stringValue(this.CLASS_NAME, nameof(this._contractName), this._contractName);

		this._gasBudget = this._config.gasBudget ?? 1_000_000_000;
		Guards.number(this.CLASS_NAME, nameof(this._gasBudget), this._gasBudget);
		if (this._gasBudget <= 0) {
			throw new GeneralError(this.CLASS_NAME, "invalidGasBudget", {
				gasBudget: this._gasBudget
			});
		}

		Iota.populateConfig(this._config);
		this._client = Iota.createClient(this._config);
	}

	/**
	 * Bootstrap the Verifiable Storage contract.
	 * @param nodeIdentity The identity of the node.
	 * @param nodeLoggingConnectorType The node logging connector type, defaults to "node-logging".
	 * @param componentState The component state.
	 * @param componentState.contractDeployments The contract deployments.
	 * @returns True if the bootstrapping process was successful.
	 */
	public async start(
		nodeIdentity: string,
		nodeLoggingConnectorType?: string,
		componentState?: { contractDeployments?: { [id: string]: string } }
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

			const contractDeployments: { [id: string]: string } =
				(componentState?.contractDeployments as { [id: string]: string }) ?? {};

			if (Is.stringValue(contractDeployments[contractData.packageId])) {
				this._deployedPackageId = contractDeployments[contractData.packageId];

				// Check if package exists on the network
				const packageExists = await Iota.packageExistsOnNetwork(
					this._client,
					contractDeployments[contractData.packageId]
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
							contractId: contractData.packageId,
							deployedPackageId: contractDeployments[contractData.packageId]
						}
					});

					return;
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
					nodeIdentity,
					contractId: contractData.packageId
				}
			});

			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			// Publish the compiled modules
			const [upgradeCap] = txb.publish({
				modules: compiledModules,
				dependencies: ["0x1", "0x2"]
			});

			const controllerAddress = await this.getPackageControllerAddress(nodeIdentity);

			// Transfer the upgrade capability to the controller
			txb.transferObjects([upgradeCap], txb.pure.address(controllerAddress));

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				nodeLogging,
				nodeIdentity,
				this._client,
				controllerAddress,
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "deploy" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "deployTransactionFailed", {
					error: result.effects?.status?.error
				});
			}

			// Find the package object (owner field will be Verifiable)
			const packageObject = result.effects?.created?.find(obj => obj.owner === "Immutable");

			const deployedPackageId = packageObject?.reference?.objectId;
			if (!Is.stringValue(deployedPackageId)) {
				throw new GeneralError(this.CLASS_NAME, "packageIdNotFound", {
					packageId: deployedPackageId
				});
			}

			this._deployedPackageId = deployedPackageId;

			if (componentState) {
				componentState.contractDeployments ??= {};
				componentState.contractDeployments[contractData.packageId] = deployedPackageId;
			}

			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "contractDeploymentCompleted",
				data: {
					deployedPackageId: this._deployedPackageId
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
	 * Create an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @param allowList The list of identities that are allowed to modify the item.
	 * @param options Additional options for creating the item.
	 * @param options.maxAllowListSize The maximum size of the allow list.
	 * @returns The id of the stored verifiable item in URN format and the receipt.
	 */
	public async create(
		controller: string,
		data: Uint8Array,
		allowList?: string[],
		options?: {
			maxAllowListSize?: number;
		}
	): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		this.ensureStarted();
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		if (!Is.empty(allowList)) {
			Guards.array<string>(this.CLASS_NAME, nameof(allowList), allowList);
		}
		if (!Is.empty(options?.maxAllowListSize)) {
			Guards.integer(this.CLASS_NAME, nameof(options.maxAllowListSize), options.maxAllowListSize);
		}
		const maxAllowListSize = Math.max(
			options?.maxAllowListSize ?? IotaVerifiableStorageConnector._DEFAULT_ALLOW_LIST_SIZE,
			1
		);

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const packageId = this._deployedPackageId;
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::store_data`,
				arguments: [
					txb.pure.string(Converter.bytesToBase64(data)),
					txb.pure.vector("address", allowList ?? []),
					txb.pure.u16(maxAllowListSize)
				]
			});

			const seed = await Iota.getSeed(this._config, this._vaultConnector, controller);
			const addresses = Iota.getAddresses(
				seed,
				this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controller,
				this._client,
				addresses[0],
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "store" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "storingTransactionFailed", {
					error: result.effects?.status?.error
				});
			}

			const storageEvent = result.events?.find(event =>
				event.type.includes("verifiable_storage::StorageCreated")
			);

			const parsedJson = storageEvent?.parsedJson as { id: string; epoch: string };

			const objectId = parsedJson?.id;

			if (!objectId) {
				throw new GeneralError(this.CLASS_NAME, "objectIdNotFound", {
					namespace: IotaVerifiableStorageConnector.NAMESPACE,
					id: objectId
				});
			}

			const receipt: IVerifiableStorageIotaReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: IotaVerifiableStorageTypes.IotaReceipt,
				epoch: parsedJson?.epoch ?? "",
				digest: result?.digest ?? ""
			};

			const urn = new Urn(
				"verifiable",
				`${IotaVerifiableStorageConnector.NAMESPACE}:${this._deployedPackageId}:${objectId}`
			);

			return {
				id: urn.toString(),
				receipt: receipt as unknown as IJsonLdNodeObject
			};
		} catch (error) {
			if (Iota.isAbortError(error, 1001)) {
				throw new GeneralError(this.CLASS_NAME, "allowListTooBig", undefined, error);
			}
			throw new GeneralError(
				this.CLASS_NAME,
				"creatingFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Update an item in verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the item to update.
	 * @param data The data to store.
	 * @param allowList Updated list of identities that are allowed to modify the item.
	 * @returns The updated receipt.
	 */
	public async update(
		controller: string,
		id: string,
		data?: Uint8Array,
		allowList?: string[]
	): Promise<IJsonLdNodeObject> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		if (!Is.empty(data)) {
			Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		}
		if (!Is.empty(allowList)) {
			Guards.array<string>(this.CLASS_NAME, nameof(allowList), allowList);
		}

		const objectId = IotaVerifiableStorageUtils.verifiableStorageIdToObjectId(id);

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const packageId = this._deployedPackageId;
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::update_data`,
				arguments: [
					txb.object(objectId),
					txb.pure.string(Is.empty(data) ? "" : Converter.bytesToBase64(data)),
					txb.pure.vector("address", allowList ?? []),
					// If the allow list is an array with no elements, we need to set the remove_allowlist flag
					txb.pure.bool(Is.array(allowList) && allowList.length === 0)
				]
			});

			const seed = await Iota.getSeed(this._config, this._vaultConnector, controller);
			const addresses = Iota.getAddresses(
				seed,
				this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controller,
				this._client,
				addresses[0],
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "update" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "updateFailed", {
					error: result.effects?.status?.error
				});
			}

			const storageEvent = result.events?.find(event =>
				event.type.includes("verifiable_storage::StorageUpdated")
			);

			const parsedJson = storageEvent?.parsedJson as { id: string; epoch: string };

			const receipt: IVerifiableStorageIotaReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: IotaVerifiableStorageTypes.IotaReceipt,
				epoch: parsedJson?.epoch ?? "",
				digest: result?.digest ?? ""
			};

			return receipt as unknown as IJsonLdNodeObject;
		} catch (error) {
			if (Iota.isAbortError(error, 401)) {
				throw new UnauthorizedError(this.CLASS_NAME, "notInAllowList", error);
			}
			if (Iota.isAbortError(error, 1001)) {
				throw new GeneralError(this.CLASS_NAME, "allowListTooBig", undefined, error);
			}
			if (error instanceof GeneralError) {
				throw error;
			}

			throw new GeneralError(
				this.CLASS_NAME,
				"updatingFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get a verifiable item.
	 * @param id The id of the item to get.
	 * @param options Additional options for getting the item.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @param options.includeAllowList Should the allow list be included in the response, defaults to true.
	 * @returns The data for the item, the receipt and the allow list.
	 */
	public async get(
		id: string,
		options?: { includeData?: boolean; includeAllowList?: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
		allowList?: string[];
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const includeData = options?.includeData ?? true;
		const includeAllowList = options?.includeAllowList ?? true;
		const objectId = IotaVerifiableStorageUtils.verifiableStorageIdToObjectId(id);

		try {
			const objectData = await this._client.getObject({
				id: objectId,
				options: {
					showContent: true,
					showPreviousTransaction: true
				}
			});

			if (!objectData.data?.content) {
				throw new GeneralError(this.CLASS_NAME, "objectNotFound");
			}

			const parsedData = objectData.data.content as unknown as {
				fields: {
					data: string;
					epoch: string;
					creator: string;
					allowlist: string[];
				};
			};

			const receipt: IVerifiableStorageIotaReceipt = {
				"@context": VerifiableStorageContexts.ContextRoot,
				type: IotaVerifiableStorageTypes.IotaReceipt,
				epoch: parsedData.fields.epoch ?? "",
				digest: objectData.data?.previousTransaction ?? ""
			};

			let dataResult: Uint8Array | undefined;

			if (includeData) {
				const base64String = parsedData.fields.data;
				dataResult = Converter.base64ToBytes(base64String);
			}

			return {
				data: dataResult,
				receipt: receipt as unknown as IJsonLdNodeObject,
				allowList: includeAllowList ? parsedData.fields.allowlist : undefined
			};
		} catch (error) {
			if (error instanceof GeneralError) {
				throw error;
			} else {
				throw new GeneralError(
					this.CLASS_NAME,
					"gettingFailed",
					undefined,
					Iota.extractPayloadError(error)
				);
			}
		}
	}

	/**
	 * Remove the item from verifiable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the verifiable item to remove in URN format.
	 * @returns A promise that resolves when the item is removed.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IotaVerifiableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaVerifiableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaVerifiableStorageUtils.verifiableStorageIdToObjectId(id);
			const packageId = IotaVerifiableStorageUtils.verifiableStorageIdToPackageId(id);
			const moduleName = this.getModuleName();

			const seed = await Iota.getSeed(this._config, this._vaultConnector, controller);
			const addresses = Iota.getAddresses(
				seed,
				this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
				0,
				this._config.walletAddressIndex ?? 0,
				1
			);

			txb.moveCall({
				target: `${packageId}::${moduleName}::delete_data`,
				arguments: [txb.object(objectId)]
			});

			const result = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				this._logging,
				controller,
				this._client,
				addresses[0],
				txb,
				{
					dryRunLabel: this._config.enableCostLogging ? "remove" : undefined
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "removingTransactionFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			if (Iota.isAbortError(error, 401)) {
				throw new UnauthorizedError(this.CLASS_NAME, "notCreator", error);
			}

			if (error instanceof GeneralError) {
				throw error;
			}

			if (error instanceof GeneralError) {
				throw error;
			} else {
				throw new GeneralError(
					this.CLASS_NAME,
					"removingFailed",
					undefined,
					Iota.extractPayloadError(error)
				);
			}
		}
	}

	/**
	 * Get the package controller's address.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The controller's address.
	 * @internal
	 */
	private async getPackageControllerAddress(identity: string): Promise<string> {
		const seed = await Iota.getSeed(this._config, this._vaultConnector, identity);
		const walletAddressIndex = this._config.packageControllerAddressIndex ?? 0;
		const addresses = Iota.getAddresses(
			seed,
			this._config.coinType ?? Iota.DEFAULT_COIN_TYPE,
			0,
			walletAddressIndex,
			1,
			false
		);

		return addresses[0];
	}

	/**
	 * Ensure that the connector is bootstrapped.
	 * @returns void
	 * @internal
	 */
	private ensureStarted(): void {
		if (!this._deployedPackageId) {
			throw new GeneralError(this.CLASS_NAME, "connectorNotStarted", {
				packageId: this._deployedPackageId
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

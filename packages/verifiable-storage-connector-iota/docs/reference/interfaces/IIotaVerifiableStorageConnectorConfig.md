# Interface: IIotaVerifiableStorageConnectorConfig

Configuration interface for IOTA VerifiableStorageConnector.

## Extends

- `IIotaConfig`

## Properties

### clientOptions

> **clientOptions**: `NetworkOrTransport`

The configuration for the client.

#### Inherited from

`IIotaConfig.clientOptions`

***

### network

> **network**: `string`

The network the operations are being performed on.

#### Inherited from

`IIotaConfig.network`

***

### vaultMnemonicId?

> `optional` **vaultMnemonicId**: `string`

The id of the entry in the vault containing the mnemonic.

#### Default

```ts
mnemonic
```

#### Inherited from

`IIotaConfig.vaultMnemonicId`

***

### vaultSeedId?

> `optional` **vaultSeedId**: `string`

The id of the entry in the vault containing the seed.

#### Default

```ts
seed
```

#### Inherited from

`IIotaConfig.vaultSeedId`

***

### coinType?

> `optional` **coinType**: `number`

The coin type.

#### Default

```ts
IOTA 4218
```

#### Inherited from

`IIotaConfig.coinType`

***

### maxAddressScanRange?

> `optional` **maxAddressScanRange**: `number`

The maximum range to scan for addresses.

#### Default

```ts
1000
```

#### Inherited from

`IIotaConfig.maxAddressScanRange`

***

### inclusionTimeoutSeconds?

> `optional` **inclusionTimeoutSeconds**: `number`

The length of time to wait for the inclusion of a transaction in seconds.

#### Default

```ts
60
```

#### Inherited from

`IIotaConfig.inclusionTimeoutSeconds`

***

### gasStation?

> `optional` **gasStation**: `IGasStationConfig`

Gas station configuration for sponsored transactions.
If provided, transactions will be processed through the gas station.

#### Inherited from

`IIotaConfig.gasStation`

***

### gasBudget?

> `optional` **gasBudget**: `number`

The default gas budget for all transactions (including sponsored and direct).

#### Default

```ts
50000000
```

#### Inherited from

`IIotaConfig.gasBudget`

***

### contractName?

> `optional` **contractName**: `string`

The name of the contract to use.

#### Default

```ts
"verifiable-storage"
```

***

### walletAddressIndex?

> `optional` **walletAddressIndex**: `number`

The wallet address index to use when deriving addresses.

#### Default

```ts
0
```

***

### packageControllerAddressIndex?

> `optional` **packageControllerAddressIndex**: `number`

The package controller address index to use when creating package.

#### Default

```ts
0
```

***

### enableCostLogging?

> `optional` **enableCostLogging**: `boolean`

Enable cost logging.

#### Default

```ts
false
```

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { IImmutableStorageConnector } from "../models/IImmutableStorageConnector";

/**
 * Factory for creating immutable storage connectors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImmutableStorageConnectorFactory = Factory.createFactory<IImmutableStorageConnector>(
	"immutable-storage-connector"
);

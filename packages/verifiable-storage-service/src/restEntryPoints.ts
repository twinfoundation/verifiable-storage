// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import {
	generateRestRoutesVerifiableStorage,
	tagsVerifiableStorage
} from "./verifiableStorageRoutes";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "verifiable",
		defaultBaseRoute: "verifiable",
		tags: tagsVerifiableStorage,
		generateRoutes: generateRestRoutesVerifiableStorage
	}
];

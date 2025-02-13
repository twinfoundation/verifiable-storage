// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import { generateRestRoutesImmutableStorage, tagsImmutableStorage } from "./immutableStorageRoutes";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "immutable",
		defaultBaseRoute: "immutable",
		tags: tagsImmutableStorage,
		generateRoutes: generateRestRoutesImmutableStorage
	}
];

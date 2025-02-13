// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ImmutableStorageClient } from "../src/immutableStorageClient";

describe("ImmutableStorageClient", () => {
	test("Can create an instance", async () => {
		const client = new ImmutableStorageClient({ endpoint: "http://localhost:8080" });
		expect(client).toBeDefined();
	});
});

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { VerifiableStorageClient } from "../src/verifiableStorageClient";

describe("VerifiableStorageClient", () => {
	test("Can create an instance", async () => {
		const client = new VerifiableStorageClient({ endpoint: "http://localhost:8080" });
		expect(client).toBeDefined();
	});
});

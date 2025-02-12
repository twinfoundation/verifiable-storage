// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError } from "@twin.org/core";
import { EntityStorageImmutableStorageConnector } from "@twin.org/immutable-storage-connector-entity-storage";
import { ImmutableStorageConnectorFactory } from "@twin.org/immutable-storage-models";
import { describe, test, expect, vi } from "vitest";
import { ImmutableStorageService } from "../src/immutableStorageService";

describe("ImmutableStorageService", () => {
	test("Can create an instance", async () => {
		ImmutableStorageConnectorFactory.register(
			EntityStorageImmutableStorageConnector.NAMESPACE,
			() => new EntityStorageImmutableStorageConnector()
		);
		const service = new ImmutableStorageService();
		expect(service).toBeDefined();
	});

	test("store method stores data correctly", async () => {
		const mockStore = vi.fn().mockResolvedValue({ id: "test-id", receipt: {} });
		ImmutableStorageConnectorFactory.register(
			EntityStorageImmutableStorageConnector.NAMESPACE,
			() => ({
				store: mockStore,
				get: vi.fn(),
				remove: vi.fn(),
				CLASS_NAME: "MockConnector"
			})
		);
		const service = new ImmutableStorageService();
		const result = await service.store("dGVzdC1kYXRh", "test-identity");
		expect(result).toEqual({ id: "test-id", receipt: {} });
		expect(mockStore).toHaveBeenCalledWith("test-identity", expect.any(Uint8Array));
	});

	test("store method throws error on failure", async () => {
		// eslint-disable-next-line no-restricted-syntax
		const mockStore = vi.fn().mockRejectedValue(new Error("store failed"));
		ImmutableStorageConnectorFactory.register(
			EntityStorageImmutableStorageConnector.NAMESPACE,
			() => ({
				store: mockStore,
				get: vi.fn(),
				remove: vi.fn(),
				CLASS_NAME: "MockConnector"
			})
		);
		const service = new ImmutableStorageService();
		await expect(service.store("dGVzdC1kYXRh", "test-identity")).rejects.toThrow(GeneralError);
	});

	test("get method retrieves data correctly", async () => {
		const mockGet = vi.fn().mockResolvedValue({ data: new Uint8Array(), receipt: {} });
		ImmutableStorageConnectorFactory.register(
			EntityStorageImmutableStorageConnector.NAMESPACE,
			() => ({
				store: vi.fn(),
				get: mockGet,
				remove: vi.fn(),
				CLASS_NAME: "MockConnector"
			})
		);
		const service = new ImmutableStorageService();
		const result = await service.get("urn:immutable:test-id");
		expect(result).toEqual({ data: new Uint8Array(), receipt: {} });
		expect(mockGet).toHaveBeenCalledWith("urn:immutable:test-id", undefined);
	});

	test("remove method removes data correctly", async () => {
		const mockRemove = vi.fn().mockResolvedValue(undefined);
		ImmutableStorageConnectorFactory.register(
			EntityStorageImmutableStorageConnector.NAMESPACE,
			() => ({
				store: vi.fn(),
				get: vi.fn(),
				remove: mockRemove,
				CLASS_NAME: "MockConnector"
			})
		);
		const service = new ImmutableStorageService();
		await service.remove("urn:immutable:test-id", "test-identity");
		expect(mockRemove).toHaveBeenCalledWith("test-identity", "urn:immutable:test-id");
	});
});

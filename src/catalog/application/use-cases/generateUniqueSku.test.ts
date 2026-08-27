import { describe, expect, it } from "vitest";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { generateUniqueSku } from "./generateUniqueSku";

describe("generateUniqueSku", () => {
  it("genera un código con el formato SKU-<10 hex>", async () => {
    const repository = { existsVariantWithSku: async () => false } as unknown as ProductRepository;

    const sku = await generateUniqueSku(repository);

    expect(sku).toMatch(/^SKU-[0-9A-F]{10}$/);
  });

  it("reintenta si el código generado ya existe, hasta encontrar uno libre", async () => {
    let calls = 0;
    const repository = {
      existsVariantWithSku: async () => {
        calls += 1;
        return calls <= 2; // las dos primeras "existen", la tercera no.
      },
    } as unknown as ProductRepository;

    const sku = await generateUniqueSku(repository);

    expect(calls).toBe(3);
    expect(sku).toMatch(/^SKU-[0-9A-F]{10}$/);
  });
});

import { describe, expect, it } from "vitest";
import { ProductStatus } from "../enums/ProductStatus";
import { InvalidProductStatusTransitionException } from "../exceptions/InvalidProductStatusTransitionException";
import { ProductMustHaveOneVariantException } from "../exceptions/ProductMustHaveOneVariantException";
import { ProductRequiresVariantException } from "../exceptions/ProductRequiresVariantException";
import { VariantNotFoundException } from "../exceptions/VariantNotFoundException";
import { CreateProductInput, Product } from "./Product";

function createProduct(overrides: Partial<CreateProductInput> = {}): Product {
  return Product.create({
    id: "product-1",
    categoryId: "category-1",
    name: "Shampoo rizos definidos",
    slug: "shampoo-rizos-definidos",
    description: "Para cabello rizado.",
    basePrice: 45000,
    variants: [{ id: "variant-1", sku: "SHP-RIZ-250", stockQuantity: 10 }],
    ...overrides,
  });
}

describe("Product.create", () => {
  it("no permite crear un producto sin variantes", () => {
    expect(() => createProduct({ variants: [] })).toThrow(ProductRequiresVariantException);
  });

  it("nace ACTIVE", () => {
    expect(createProduct().status).toBe(ProductStatus.ACTIVE);
  });
});

describe("Product — variantes", () => {
  it("agrega una variante nueva", () => {
    const product = createProduct();
    product.addVariant({ id: "variant-2", sku: "SHP-RIZ-500", stockQuantity: 5 });

    expect(product.variants).toHaveLength(2);
  });

  it("no permite quitar la última variante", () => {
    const product = createProduct();

    expect(() => product.removeVariant("variant-1")).toThrow(ProductMustHaveOneVariantException);
  });

  it("permite quitar una variante si queda al menos otra", () => {
    const product = createProduct();
    product.addVariant({ id: "variant-2", sku: "SHP-RIZ-500", stockQuantity: 5 });

    product.removeVariant("variant-1");

    expect(product.variants.map((variant) => variant.id)).toEqual(["variant-2"]);
  });

  it("lanza VariantNotFoundException al editar una variante que no existe", () => {
    const product = createProduct();

    expect(() => product.updateVariant("no-existe", { color: "negro" })).toThrow(
      VariantNotFoundException,
    );
  });
});

describe("Product — archive/reactivate", () => {
  it("archiva un producto ACTIVE", () => {
    const product = createProduct();
    product.archive();

    expect(product.status).toBe(ProductStatus.ARCHIVED);
  });

  it("no permite archivar un producto ya archivado", () => {
    const product = createProduct();
    product.archive();

    expect(() => product.archive()).toThrow(InvalidProductStatusTransitionException);
  });

  it("reactiva un producto archivado", () => {
    const product = createProduct();
    product.archive();

    product.reactivate();

    expect(product.status).toBe(ProductStatus.ACTIVE);
  });

  it("no permite reactivar un producto que no está archivado", () => {
    const product = createProduct();

    expect(() => product.reactivate()).toThrow(InvalidProductStatusTransitionException);
  });
});

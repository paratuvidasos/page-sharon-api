import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, Locale } from "../../../shared-kernel/domain/enums/Locale";
import { ProductStatus } from "../enums/ProductStatus";
import { InvalidProductStatusTransitionException } from "../exceptions/InvalidProductStatusTransitionException";
import { InvalidProductTranslationException } from "../exceptions/InvalidProductTranslationException";
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

describe("Product — traducciones", () => {
  it("no permite traducir al idioma base del catálogo", () => {
    const product = createProduct();

    expect(() =>
      product.setTranslation(DEFAULT_LOCALE, { name: "x", description: "y" }, "translation-1"),
    ).toThrow(InvalidProductTranslationException);
  });

  it("localizedName cae al nombre base si no hay traducción para el idioma pedido", () => {
    const product = createProduct();

    expect(product.localizedName(Locale.EN)).toBe("Shampoo rizos definidos");
  });

  it("localizedName/localizedDescription devuelven la traducción una vez seteada", () => {
    const product = createProduct();
    product.setTranslation(Locale.EN, { name: "Curl shampoo", description: "For curly hair." }, "translation-1");

    expect(product.localizedName(Locale.EN)).toBe("Curl shampoo");
    expect(product.localizedDescription(Locale.EN)).toBe("For curly hair.");
    expect(product.localizedName(DEFAULT_LOCALE)).toBe("Shampoo rizos definidos");
  });

  it("conserva el id de la traducción existente al reemplazarla, en vez de crear una fila nueva", () => {
    const product = createProduct();
    product.setTranslation(Locale.EN, { name: "Curl shampoo", description: "For curly hair." }, "translation-1");
    product.setTranslation(Locale.EN, { name: "Curl shampoo v2", description: "Updated." }, "translation-2");

    expect(product.translations).toEqual([
      { id: "translation-1", locale: Locale.EN, name: "Curl shampoo v2", description: "Updated." },
    ]);
  });

  it("removeTranslation quita la traducción del idioma", () => {
    const product = createProduct();
    product.setTranslation(Locale.EN, { name: "Curl shampoo", description: "For curly hair." }, "translation-1");

    product.removeTranslation(Locale.EN);

    expect(product.translations).toEqual([]);
    expect(product.localizedName(Locale.EN)).toBe("Shampoo rizos definidos");
  });
});

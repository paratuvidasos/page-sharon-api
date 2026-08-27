import { describe, expect, it } from "vitest";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { generateUniqueSlug, slugify } from "./generateUniqueSlug";

describe("slugify", () => {
  it("pasa a minúsculas y reemplaza espacios por guiones", () => {
    expect(slugify("Shampoo Rizos Definidos")).toBe("shampoo-rizos-definidos");
  });

  it("quita tildes y diéresis", () => {
    expect(slugify("Acondicionador Nutritivo Ñandú")).toBe("acondicionador-nutritivo-nandu");
  });

  it("colapsa puntuación y espacios repetidos en un solo guion", () => {
    expect(slugify("¡Crema-para el Peinado!  Extra   Fuerte")).toBe(
      "crema-para-el-peinado-extra-fuerte",
    );
  });

  it("no deja guiones al principio ni al final", () => {
    expect(slugify("  --Shampoo--  ")).toBe("shampoo");
  });

  it("cae a 'producto' si el nombre no tiene ningún caracter alfanumérico", () => {
    expect(slugify("¡¡¡!!!")).toBe("producto");
  });
});

describe("generateUniqueSlug", () => {
  function fakeRepository(existingSlugs: string[]): ProductRepository {
    return {
      findBySlug: async (slug: string) => (existingSlugs.includes(slug) ? ({} as never) : null),
    } as ProductRepository;
  }

  it("usa el slug derivado del nombre si está libre", async () => {
    const repository = fakeRepository([]);
    const slug = await generateUniqueSlug(repository, "Shampoo Rizos");
    expect(slug).toBe("shampoo-rizos");
  });

  it("agrega -2 si el slug base ya existe", async () => {
    const repository = fakeRepository(["shampoo-rizos"]);
    const slug = await generateUniqueSlug(repository, "Shampoo Rizos");
    expect(slug).toBe("shampoo-rizos-2");
  });

  it("sigue incrementando el sufijo hasta encontrar uno libre", async () => {
    const repository = fakeRepository(["shampoo-rizos", "shampoo-rizos-2", "shampoo-rizos-3"]);
    const slug = await generateUniqueSlug(repository, "Shampoo Rizos");
    expect(slug).toBe("shampoo-rizos-4");
  });
});

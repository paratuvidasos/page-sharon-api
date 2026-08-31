import { describe, expect, it } from "vitest";
import { InvalidCategoryException } from "../exceptions/InvalidCategoryException";
import { Category } from "./Category";

describe("Category.create", () => {
  it("normaliza el slug a minúsculas", () => {
    const category = Category.create({ id: "cat-1", name: "Shampoos", slug: "Shampoos" });
    expect(category.slug).toBe("shampoos");
  });

  it("rechaza un slug con espacios o mayúsculas de acentos", () => {
    expect(() => Category.create({ id: "cat-1", name: "Shampoos", slug: "sham poos" })).toThrow(
      InvalidCategoryException,
    );
  });

  it("no permite que una categoría sea su propio padre", () => {
    expect(() =>
      Category.create({ id: "cat-1", name: "Shampoos", slug: "shampoos", parentId: "cat-1" }),
    ).toThrow(InvalidCategoryException);
  });

  it("rechaza un nombre vacío", () => {
    expect(() => Category.create({ id: "cat-1", name: "   ", slug: "shampoos" })).toThrow(
      InvalidCategoryException,
    );
  });
});

describe("Category.update", () => {
  it("no permite reasignarse a sí misma como padre", () => {
    const category = Category.create({ id: "cat-1", name: "Shampoos", slug: "shampoos" });
    expect(() => category.update({ parentId: "cat-1" })).toThrow(InvalidCategoryException);
  });
});

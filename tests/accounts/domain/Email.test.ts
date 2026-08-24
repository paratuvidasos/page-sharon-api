import { describe, expect, it } from "vitest";
import { Email } from "../../../src/accounts/domain/value-objects/Email";

describe("Email", () => {
  it("normaliza a minúsculas y sin espacios", () => {
    const email = Email.create("  Ana@Example.com  ");
    expect(email.toString()).toBe("ana@example.com");
  });

  it("rechaza un string sin @", () => {
    expect(() => Email.create("ana-example.com")).toThrow("Email inválido");
  });

  it("rechaza un string sin dominio", () => {
    expect(() => Email.create("ana@")).toThrow("Email inválido");
  });

  it("rechaza un string con espacios internos", () => {
    expect(() => Email.create("an a@example.com")).toThrow("Email inválido");
  });

  it("equals compara por valor normalizado", () => {
    const a = Email.create("Ana@Example.com");
    const b = Email.create("ana@example.com");
    const c = Email.create("otra@example.com");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

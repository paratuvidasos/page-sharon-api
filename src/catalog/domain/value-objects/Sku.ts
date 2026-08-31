import { InvalidSkuException } from "../exceptions/InvalidSkuException";

export class Sku {
  private constructor(private readonly value: string) {}

  static of(raw: string): Sku {
    const normalized = raw.trim().toUpperCase();
    if (normalized.length < 3 || normalized.length > 50) {
      throw new InvalidSkuException(raw);
    }
    return new Sku(normalized);
  }

  toString(): string {
    return this.value;
  }
}

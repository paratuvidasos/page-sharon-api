import { randomBytes } from "crypto";
import { ProductRepository } from "../../domain/repositories/ProductRepository";

/**
 * El SKU es un código interno de bodega, no algo que el admin tenga que
 * inventar ni que necesite ser legible — un código corto y único alcanza.
 * `SKU-` + 10 caracteres hexadecimales en mayúscula (5 bytes al azar).
 */
function randomSku(): string {
  return `SKU-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * Prácticamente nunca colisiona (2^40 combinaciones), pero se verifica y se
 * reintenta igual: un código "único" que en realidad no lo comprobó no es
 * una garantía, es una apuesta.
 */
export async function generateUniqueSku(productRepository: ProductRepository): Promise<string> {
  let candidate = randomSku();
  while (await productRepository.existsVariantWithSku(candidate)) {
    candidate = randomSku();
  }
  return candidate;
}

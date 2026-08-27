import { ProductRepository } from "../../domain/repositories/ProductRepository";

// Rango Unicode de los diacríticos combinantes que deja "NFD" (tildes,
// diéresis, etc.) separados de su letra base. Se recorre por code point en
// vez de con un regex de rango unicode para no depender de cómo el
// tooling/editor trate esos caracteres al guardar el archivo.
const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;

function stripDiacritics(value: string): string {
  let result = "";
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint < COMBINING_MARKS_START || codePoint > COMBINING_MARKS_END) {
      result += char;
    }
  }
  return result;
}

/**
 * Normaliza un nombre a slug: minúsculas, sin tildes/diacríticos, espacios y
 * cualquier caracter no alfanumérico colapsados a un solo guion, sin guiones
 * al principio o al final.
 */
export function slugify(name: string): string {
  const normalized = stripDiacritics(name.normalize("NFD"))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "producto";
}

/**
 * El slug es la URL del producto, no una decisión del admin — se deriva del
 * nombre. Si ya existe (mismo nombre que otro producto, o coincidencia), se
 * agrega un sufijo numérico hasta encontrar uno libre: "shampoo-rizos",
 * "shampoo-rizos-2", "shampoo-rizos-3"...
 */
export async function generateUniqueSlug(
  productRepository: ProductRepository,
  name: string,
): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (await productRepository.findBySlug(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

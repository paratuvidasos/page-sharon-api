import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Product } from "../../domain/entities/Product";
import { CreateProductVariantInput } from "../../domain/entities/ProductVariant";
import { CategoryNotFoundException } from "../../domain/exceptions/CategoryNotFoundException";
import { DuplicateSkuException } from "../../domain/exceptions/DuplicateSkuException";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { validateAttributesAgainstDefinitions } from "./validateProductAttributes";
import { generateUniqueSku } from "./generateUniqueSku";
import { generateUniqueSlug } from "./generateUniqueSlug";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";

export interface CreateProductVariantRequestInput extends Omit<CreateProductVariantInput, "id" | "sku"> {
  /** [0057]: opcional — si no viene, se genera un código único del lado del servidor. */
  sku?: string;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  /** [0057]: opcional — si no viene, se deriva de `name` y se verifica que sea único. */
  slug?: string;
  description: string;
  brand?: string | null;
  ingredients?: string | null;
  attributes?: Record<string, string>;
  basePrice: number;
  compareAtPrice?: number | null;
  images?: string[];
  variants: CreateProductVariantRequestInput[];
}

export interface CreateProductResult {
  id: string;
  slug: string;
}

/**
 * [0057]: alta de un producto (con sus variantes) desde el panel administrativo.
 *
 * `slug` y `sku` son identificadores técnicos (URL del producto, código de
 * bodega), no una decisión de negocio que le corresponda inventar al admin:
 * si no vienen en la petición, este caso de uso los genera y los devuelve en
 * la respuesta. Si sí vienen (un cliente interno que necesite fijarlos a
 * mano), se respetan tal cual, con la misma validación de unicidad que ya
 * existía.
 */
export class CreateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly attributeDefinitionRepository: AttributeDefinitionRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<CreateProductResult> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (input.attributes) {
      await validateAttributesAgainstDefinitions(this.attributeDefinitionRepository, input.attributes);
    }

    const slug = input.slug ?? (await generateUniqueSlug(this.productRepository, input.name));

    const variants: CreateProductVariantInput[] = [];
    for (const variant of input.variants) {
      const sku = await this.resolveSku(variant.sku);
      variants.push({ id: generateId(), ...variant, sku });
    }

    const product = Product.create({
      id: generateId(),
      ...input,
      slug,
      variants,
    });
    await this.productRepository.save(product);
    return { id: product.id, slug };
  }

  /**
   * Si el cliente manda un SKU, se respeta tal cual y solo se valida que no
   * choque con otro ya existente (comportamiento previo, sin cambios). Si no
   * lo manda, se genera uno nuevo — ya verificado como único, no hace falta
   * chequearlo de nuevo.
   */
  private async resolveSku(sku: string | undefined): Promise<string> {
    if (!sku) {
      return generateUniqueSku(this.productRepository);
    }
    if (await this.productRepository.existsVariantWithSku(sku)) {
      throw new DuplicateSkuException(sku);
    }
    return sku;
  }
}

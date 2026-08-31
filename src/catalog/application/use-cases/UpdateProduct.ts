import { CategoryNotFoundException } from "../../domain/exceptions/CategoryNotFoundException";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { validateAttributesAgainstDefinitions } from "./validateProductAttributes";

export interface UpdateProductInput {
  productId: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  brand?: string | null;
  ingredients?: string | null;
  attributes?: Record<string, string>;
  basePrice?: number;
  compareAtPrice?: number | null;
  images?: string[];
}

/** [0057]: edición de los campos propios de un producto (sin sus variantes, ver `AddProductVariant`/`UpdateProductVariant`/`RemoveProductVariant`). */
export class UpdateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly attributeDefinitionRepository: AttributeDefinitionRepository,
  ) {}

  async execute(input: UpdateProductInput): Promise<void> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    if (input.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new CategoryNotFoundException();
      }
      product.changeCategory(input.categoryId);
    }

    if (input.attributes) {
      await validateAttributesAgainstDefinitions(this.attributeDefinitionRepository, input.attributes);
    }

    product.update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      brand: input.brand,
      ingredients: input.ingredients,
      attributes: input.attributes,
      basePrice: input.basePrice,
      compareAtPrice: input.compareAtPrice,
      images: input.images,
    });

    await this.productRepository.save(product);
  }
}

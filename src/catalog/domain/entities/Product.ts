import { ProductStatus } from "../enums/ProductStatus";
import { ProductRequiresVariantException } from "../exceptions/ProductRequiresVariantException";
import { Money } from "../value-objects/Money";
import { CreateProductVariantInput, ProductVariant } from "./ProductVariant";

export interface ProductProps {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  ingredients: string | null;
  attributes: Record<string, string>;
  basePrice: Money;
  compareAtPrice: Money | null;
  status: ProductStatus;
  images: string[];
  variants: ProductVariant[];
  createdAt: Date;
}

export interface CreateProductInput {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  brand?: string | null;
  ingredients?: string | null;
  attributes?: Record<string, string>;
  basePrice: number;
  compareAtPrice?: number | null;
  images?: string[];
  variants: CreateProductVariantInput[];
}

export class Product {
  private constructor(private props: ProductProps) {}

  static create(input: CreateProductInput): Product {
    if (input.variants.length === 0) {
      throw new ProductRequiresVariantException();
    }

    return new Product({
      id: input.id,
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      brand: input.brand ?? null,
      ingredients: input.ingredients ?? null,
      attributes: input.attributes ?? {},
      basePrice: Money.of(input.basePrice),
      compareAtPrice: input.compareAtPrice != null ? Money.of(input.compareAtPrice) : null,
      status: ProductStatus.ACTIVE,
      images: input.images ?? [],
      variants: input.variants.map((variant) => ProductVariant.create(variant)),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }

  toProps(): ProductProps {
    return { ...this.props, variants: [...this.props.variants] };
  }
}

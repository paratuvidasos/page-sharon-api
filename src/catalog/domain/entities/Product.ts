import { ProductStatus } from "../enums/ProductStatus";
import { InvalidProductStatusTransitionException } from "../exceptions/InvalidProductStatusTransitionException";
import { ProductMustHaveOneVariantException } from "../exceptions/ProductMustHaveOneVariantException";
import { ProductRequiresVariantException } from "../exceptions/ProductRequiresVariantException";
import { VariantNotFoundException } from "../exceptions/VariantNotFoundException";
import { Money } from "../value-objects/Money";
import { CreateProductVariantInput, ProductVariant, UpdateProductVariantInput } from "./ProductVariant";

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

export interface UpdateProductInput {
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

  get categoryId(): string {
    return this.props.categoryId;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get variants(): ProductVariant[] {
    return [...this.props.variants];
  }

  /**
   * [0057]: edición de los campos propios del producto. La categoría tiene su
   * propio método (`changeCategory`) porque cambiarla exige validar que la
   * categoría destino exista, algo que este agregado no puede comprobar por
   * sí solo — esa validación vive en el caso de uso.
   */
  update(input: UpdateProductInput): void {
    if (input.name !== undefined) {
      this.props.name = input.name;
    }
    if (input.slug !== undefined) {
      this.props.slug = input.slug;
    }
    if (input.description !== undefined) {
      this.props.description = input.description;
    }
    if (input.brand !== undefined) {
      this.props.brand = input.brand;
    }
    if (input.ingredients !== undefined) {
      this.props.ingredients = input.ingredients;
    }
    if (input.attributes !== undefined) {
      this.props.attributes = input.attributes;
    }
    if (input.basePrice !== undefined) {
      this.props.basePrice = Money.of(input.basePrice);
    }
    if (input.compareAtPrice !== undefined) {
      this.props.compareAtPrice = input.compareAtPrice != null ? Money.of(input.compareAtPrice) : null;
    }
    if (input.images !== undefined) {
      this.props.images = input.images;
    }
  }

  changeCategory(categoryId: string): void {
    this.props.categoryId = categoryId;
  }

  /**
   * Mutadores puntuales y no un "reemplazar todo el arreglo": las variantes
   * cargan stock vivo, y un replace ciego arriesga poner en cero el stock de
   * una variante que el admin no tocó (distinto de `ShippingZone.replaceRates`,
   * donde las tarifas no cargan estado que un replace pueda destruir).
   */
  addVariant(input: CreateProductVariantInput): void {
    this.props.variants = [...this.props.variants, ProductVariant.create(input)];
  }

  updateVariant(variantId: string, input: UpdateProductVariantInput): void {
    const variant = this.props.variants.find((candidate) => candidate.id === variantId);
    if (!variant) {
      throw new VariantNotFoundException();
    }
    variant.update(input);
  }

  removeVariant(variantId: string): void {
    const exists = this.props.variants.some((variant) => variant.id === variantId);
    if (!exists) {
      throw new VariantNotFoundException();
    }
    if (this.props.variants.length <= 1) {
      throw new ProductMustHaveOneVariantException();
    }
    this.props.variants = this.props.variants.filter((variant) => variant.id !== variantId);
  }

  /**
   * [0057]: "no se puede eliminar un producto con pedidos históricos
   * asociados; se puede archivar en su lugar" (AC). Solo válido desde ACTIVE
   * o INACTIVE — un producto ya archivado no se vuelve a archivar.
   */
  archive(): void {
    if (this.props.status === ProductStatus.ARCHIVED) {
      throw new InvalidProductStatusTransitionException(this.props.status, ProductStatus.ARCHIVED);
    }
    this.props.status = ProductStatus.ARCHIVED;
  }

  reactivate(): void {
    if (this.props.status !== ProductStatus.ARCHIVED) {
      throw new InvalidProductStatusTransitionException(this.props.status, ProductStatus.ACTIVE);
    }
    this.props.status = ProductStatus.ACTIVE;
  }

  toProps(): ProductProps {
    return { ...this.props, variants: [...this.props.variants] };
  }
}

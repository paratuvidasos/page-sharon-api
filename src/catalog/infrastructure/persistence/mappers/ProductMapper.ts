import { Product } from "../../../domain/entities/Product";
import { ProductVariant } from "../../../domain/entities/ProductVariant";
import { Money } from "../../../domain/value-objects/Money";
import { Sku } from "../../../domain/value-objects/Sku";
import { ProductOrmEntity } from "../entities/ProductOrmEntity";
import { ProductVariantOrmEntity } from "../entities/ProductVariantOrmEntity";

export class ProductMapper {
  static toOrm(product: Product): ProductOrmEntity {
    const props = product.toProps();

    const orm = new ProductOrmEntity();
    orm.id = props.id;
    orm.categoryId = props.categoryId;
    orm.name = props.name;
    orm.slug = props.slug;
    orm.description = props.description;
    orm.brand = props.brand;
    orm.ingredients = props.ingredients;
    orm.attributes = props.attributes;
    orm.basePrice = props.basePrice.amount.toFixed(2);
    orm.compareAtPrice = props.compareAtPrice != null ? props.compareAtPrice.amount.toFixed(2) : null;
    orm.status = props.status;
    orm.images = props.images;
    orm.variants = props.variants.map((variant) => this.variantToOrm(variant, props.id));
    return orm;
  }

  static toDomain(orm: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: orm.id,
      categoryId: orm.categoryId,
      name: orm.name,
      slug: orm.slug,
      description: orm.description,
      brand: orm.brand,
      ingredients: orm.ingredients,
      attributes: orm.attributes,
      basePrice: Money.of(Number(orm.basePrice)),
      compareAtPrice: orm.compareAtPrice != null ? Money.of(Number(orm.compareAtPrice)) : null,
      status: orm.status,
      images: orm.images,
      variants: orm.variants.map((variant) => this.variantToDomain(variant)),
      createdAt: orm.createdAt,
    });
  }

  private static variantToOrm(variant: ProductVariant, productId: string): ProductVariantOrmEntity {
    const props = variant.toProps();

    const orm = new ProductVariantOrmEntity();
    orm.id = props.id;
    orm.productId = productId;
    orm.sku = props.sku.toString();
    orm.size = props.size;
    orm.scent = props.scent;
    orm.color = props.color;
    orm.priceOverride = props.priceOverride != null ? props.priceOverride.amount.toFixed(2) : null;
    orm.stockQuantity = props.stockQuantity;
    orm.lowStockThreshold = props.lowStockThreshold;
    orm.imageUrl = props.imageUrl;
    orm.weightGrams = props.parcel.weightGrams;
    orm.lengthCm = props.parcel.lengthCm != null ? props.parcel.lengthCm.toFixed(2) : null;
    orm.widthCm = props.parcel.widthCm != null ? props.parcel.widthCm.toFixed(2) : null;
    orm.heightCm = props.parcel.heightCm != null ? props.parcel.heightCm.toFixed(2) : null;
    return orm;
  }

  private static variantToDomain(orm: ProductVariantOrmEntity): ProductVariant {
    return ProductVariant.reconstitute({
      id: orm.id,
      sku: Sku.of(orm.sku),
      size: orm.size,
      scent: orm.scent,
      color: orm.color,
      priceOverride: orm.priceOverride != null ? Money.of(Number(orm.priceOverride)) : null,
      stockQuantity: orm.stockQuantity,
      lowStockThreshold: orm.lowStockThreshold,
      imageUrl: orm.imageUrl,
      parcel: {
        weightGrams: orm.weightGrams,
        lengthCm: orm.lengthCm != null ? Number(orm.lengthCm) : null,
        widthCm: orm.widthCm != null ? Number(orm.widthCm) : null,
        heightCm: orm.heightCm != null ? Number(orm.heightCm) : null,
      },
    });
  }
}

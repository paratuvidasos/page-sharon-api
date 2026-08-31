import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { StockStatus } from "../../domain/enums/StockStatus";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { ProductRatingSummary, RatingSummaryPort } from "../ports/RatingSummaryPort";

export interface GetProductDetailInput {
  slug: string;
  locale: Locale;
}

export interface ProductDetailVariant {
  id: string;
  sku: string;
  size: string | null;
  scent: string | null;
  color: string | null;
  price: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  imageUrl: string | null;
}

export interface ProductDetailResult {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string | null;
  ingredients: string | null;
  attributes: Record<string, string>;
  images: string[];
  basePrice: number;
  compareAtPrice: number | null;
  variants: ProductDetailVariant[];
  rating: ProductRatingSummary;
}

const NO_RATING: ProductRatingSummary = { average: null, count: 0 };

/**
 * Cubre [0014] (ficha de detalle completa) y [0015] (selección de variante):
 * cada variante ya trae su propio precio efectivo, stock e imagen, así que
 * la selección de variante en el frontend no necesita ningún otro endpoint.
 */
export class GetProductDetail {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly ratingSummaryPort?: RatingSummaryPort,
  ) {}

  async execute(input: GetProductDetailInput): Promise<ProductDetailResult> {
    const product = await this.productRepository.findBySlug(input.slug);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const props = product.toProps();
    const rating = this.ratingSummaryPort
      ? ((await this.ratingSummaryPort.execute({ productIds: [props.id] })).get(props.id) ?? NO_RATING)
      : NO_RATING;

    return {
      id: props.id,
      slug: props.slug,
      name: product.localizedName(input.locale),
      description: product.localizedDescription(input.locale),
      brand: props.brand,
      ingredients: props.ingredients,
      attributes: props.attributes,
      images: props.images,
      basePrice: props.basePrice.amount,
      compareAtPrice: props.compareAtPrice?.amount ?? null,
      variants: props.variants.map((variant) => {
        const variantProps = variant.toProps();
        return {
          id: variantProps.id,
          sku: variantProps.sku.toString(),
          size: variantProps.size,
          scent: variantProps.scent,
          color: variantProps.color,
          price: variant.effectivePrice(props.basePrice).amount,
          stockQuantity: variantProps.stockQuantity,
          stockStatus: variant.stockStatus(),
          imageUrl: variantProps.imageUrl,
        };
      }),
      rating,
    };
  }
}

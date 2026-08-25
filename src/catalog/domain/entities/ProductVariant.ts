import { computeStockStatus, StockStatus } from "../enums/StockStatus";
import { Money } from "../value-objects/Money";
import { Sku } from "../value-objects/Sku";

/**
 * [0048]: medidas del bulto para cotizar con la transportadora. Cero o `null`
 * significa "todavía no se midió", y `shipping` lo interpreta como motivo
 * para usar la tarifa de respaldo en vez de pedir una cotización con datos
 * que sabe incompletos.
 */
export interface ParcelDimensions {
  weightGrams: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
}

export interface ProductVariantProps {
  id: string;
  sku: Sku;
  size: string | null;
  scent: string | null;
  color: string | null;
  priceOverride: Money | null;
  stockQuantity: number;
  imageUrl: string | null;
  parcel: ParcelDimensions;
}

export interface CreateProductVariantInput {
  id: string;
  sku: string;
  size?: string | null;
  scent?: string | null;
  color?: string | null;
  priceOverride?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  parcel?: Partial<ParcelDimensions>;
}

/**
 * Entidad hija del agregado `Product` — no tiene repositorio propio, se
 * persiste siempre junto al producto (ver "Repository pattern" del
 * CLAUDE.md del repo).
 */
export class ProductVariant {
  private constructor(private props: ProductVariantProps) {}

  static create(input: CreateProductVariantInput): ProductVariant {
    return new ProductVariant({
      id: input.id,
      sku: Sku.of(input.sku),
      size: input.size ?? null,
      scent: input.scent ?? null,
      color: input.color ?? null,
      priceOverride: input.priceOverride != null ? Money.of(input.priceOverride) : null,
      stockQuantity: input.stockQuantity,
      imageUrl: input.imageUrl ?? null,
      parcel: {
        weightGrams: input.parcel?.weightGrams ?? 0,
        lengthCm: input.parcel?.lengthCm ?? null,
        widthCm: input.parcel?.widthCm ?? null,
        heightCm: input.parcel?.heightCm ?? null,
      },
    });
  }

  static reconstitute(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  get id(): string {
    return this.props.id;
  }

  effectivePrice(basePrice: Money): Money {
    return this.props.priceOverride ?? basePrice;
  }

  stockStatus(): StockStatus {
    return computeStockStatus(this.props.stockQuantity);
  }

  toProps(): ProductVariantProps {
    return { ...this.props, parcel: { ...this.props.parcel } };
  }
}

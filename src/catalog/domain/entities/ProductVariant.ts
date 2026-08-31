import { computeStockStatus, StockStatus } from "../enums/StockStatus";
import { InvalidStockAdjustmentException } from "../exceptions/InvalidStockAdjustmentException";
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
  /** [0059]: `null` = usar el umbral global (`LOW_STOCK_THRESHOLD`). */
  lowStockThreshold: number | null;
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
  lowStockThreshold?: number | null;
  imageUrl?: string | null;
  parcel?: Partial<ParcelDimensions>;
}

/**
 * [0057]: edición de una variante existente. No incluye `sku` (identidad de
 * la variante, no se cambia) ni `stockQuantity` (lo posee `AdjustVariantStock`,
 * [0059] — no es un dato que se edite junto con el resto del formulario).
 */
export interface UpdateProductVariantInput {
  size?: string | null;
  scent?: string | null;
  color?: string | null;
  priceOverride?: number | null;
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
      lowStockThreshold: input.lowStockThreshold ?? null,
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

  get sku(): Sku {
    return this.props.sku;
  }

  update(input: UpdateProductVariantInput): void {
    if (input.size !== undefined) {
      this.props.size = input.size;
    }
    if (input.scent !== undefined) {
      this.props.scent = input.scent;
    }
    if (input.color !== undefined) {
      this.props.color = input.color;
    }
    if (input.priceOverride !== undefined) {
      this.props.priceOverride = input.priceOverride != null ? Money.of(input.priceOverride) : null;
    }
    if (input.imageUrl !== undefined) {
      this.props.imageUrl = input.imageUrl;
    }
    if (input.parcel !== undefined) {
      this.props.parcel = {
        weightGrams: input.parcel.weightGrams ?? this.props.parcel.weightGrams,
        lengthCm: input.parcel.lengthCm !== undefined ? input.parcel.lengthCm : this.props.parcel.lengthCm,
        widthCm: input.parcel.widthCm !== undefined ? input.parcel.widthCm : this.props.parcel.widthCm,
        heightCm: input.parcel.heightCm !== undefined ? input.parcel.heightCm : this.props.parcel.heightCm,
      };
    }
  }

  effectivePrice(basePrice: Money): Money {
    return this.props.priceOverride ?? basePrice;
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  get lowStockThreshold(): number | null {
    return this.props.lowStockThreshold;
  }

  stockStatus(): StockStatus {
    return computeStockStatus(this.props.stockQuantity, this.props.lowStockThreshold ?? undefined);
  }

  /**
   * [0059]: ajuste manual del admin — set absoluto, no delta: es lo que ve en
   * pantalla ("stock actual"), no un incremento. El descuento por venta y la
   * devolución por cancelación viven en `StockReservationRepository`
   * (`hold`/`releaseCommitted`), a nivel SQL, sin pasar por acá — son
   * movimientos de otro flujo, no una edición del admin.
   */
  setStock(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new InvalidStockAdjustmentException(quantity);
    }
    this.props.stockQuantity = quantity;
  }

  setLowStockThreshold(threshold: number | null): void {
    if (threshold != null && (!Number.isInteger(threshold) || threshold < 0)) {
      throw new InvalidStockAdjustmentException(threshold);
    }
    this.props.lowStockThreshold = threshold;
  }

  toProps(): ProductVariantProps {
    return { ...this.props, parcel: { ...this.props.parcel } };
  }
}

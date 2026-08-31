import { CouponDiscountType } from "../enums/CouponDiscountType";
import { CouponExpiredException } from "../exceptions/CouponExpiredException";
import { CouponMinimumPurchaseNotMetException } from "../exceptions/CouponMinimumPurchaseNotMetException";
import { CouponUsageLimitReachedException } from "../exceptions/CouponUsageLimitReachedException";
import { InvalidCouponException } from "../exceptions/InvalidCouponException";

export interface CouponProps {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minPurchaseAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionsCount: number;
  /** [0061]: `null` = aplica a todo el carrito. */
  applicableProductIds: string[] | null;
  createdAt: Date;
}

export interface CreateCouponInput {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minPurchaseAmount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
  applicableProductIds?: string[] | null;
}

/**
 * [0061]: no incluye `code` ni `discountType` — cambiar el tipo de descuento
 * de un cupón que ya se venía redimiendo como porcentaje (o viceversa) es un
 * cambio de reglas a mitad de camino que confunde el uso acumulado; para eso
 * se crea un cupón nuevo. Mismo criterio que `ShippingZone` con `countryCode`.
 */
export interface UpdateCouponInput {
  discountValue?: number;
  minPurchaseAmount?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
  applicableProductIds?: string[] | null;
}

export class Coupon {
  private constructor(private props: CouponProps) {}

  static create(input: CreateCouponInput): Coupon {
    if (input.discountValue <= 0) {
      throw new InvalidCouponException("El valor del descuento debe ser mayor a cero.");
    }
    if (input.discountType === CouponDiscountType.PERCENTAGE && input.discountValue > 100) {
      throw new InvalidCouponException("Un descuento porcentual no puede superar 100.");
    }

    return new Coupon({
      id: input.id,
      code: input.code.toUpperCase(),
      discountType: input.discountType,
      discountValue: input.discountValue,
      minPurchaseAmount: input.minPurchaseAmount ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isActive: true,
      maxRedemptions: input.maxRedemptions ?? null,
      redemptionsCount: 0,
      applicableProductIds: normalizeProductIds(input.applicableProductIds ?? null),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  get code(): string {
    return this.props.code;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /** Lanza la excepción específica correspondiente si el cupón no aplica hoy para `subtotal`. */
  assertApplicable(subtotal: number, now: Date): void {
    if (
      !this.props.isActive ||
      (this.props.startsAt && now < this.props.startsAt) ||
      (this.props.endsAt && now > this.props.endsAt)
    ) {
      throw new CouponExpiredException();
    }
    if (this.props.maxRedemptions != null && this.props.redemptionsCount >= this.props.maxRedemptions) {
      throw new CouponUsageLimitReachedException();
    }
    if (this.props.minPurchaseAmount != null && subtotal < this.props.minPurchaseAmount) {
      throw new CouponMinimumPurchaseNotMetException(this.props.minPurchaseAmount);
    }
  }

  /** [0061]: si el cupón restringe por producto, si `productId` es uno de los elegibles. `null` = aplica a todos. */
  appliesToProduct(productId: string): boolean {
    return this.props.applicableProductIds == null || this.props.applicableProductIds.includes(productId);
  }

  /**
   * `applicableSubtotal` es la suma de solo las líneas que matchean
   * `appliesToProduct` — la calcula el llamador (`computeCartTotals`), que es
   * quien conoce las líneas del carrito; el cupón no conoce el carrito.
   * Cuando el cupón aplica a todo, `applicableSubtotal === subtotal` y el
   * cálculo queda igual que antes de [0061].
   */
  discountAmount(applicableSubtotal: number): number {
    const raw =
      this.props.discountType === CouponDiscountType.PERCENTAGE
        ? applicableSubtotal * (this.props.discountValue / 100)
        : this.props.discountValue;
    return Math.min(raw, applicableSubtotal);
  }

  activate(): void {
    this.props.isActive = true;
  }

  deactivate(): void {
    this.props.isActive = false;
  }

  update(input: UpdateCouponInput): void {
    if (input.discountValue !== undefined) {
      if (input.discountValue <= 0) {
        throw new InvalidCouponException("El valor del descuento debe ser mayor a cero.");
      }
      if (this.props.discountType === CouponDiscountType.PERCENTAGE && input.discountValue > 100) {
        throw new InvalidCouponException("Un descuento porcentual no puede superar 100.");
      }
      this.props.discountValue = input.discountValue;
    }
    if (input.minPurchaseAmount !== undefined) {
      this.props.minPurchaseAmount = input.minPurchaseAmount;
    }
    if (input.startsAt !== undefined) {
      this.props.startsAt = input.startsAt;
    }
    if (input.endsAt !== undefined) {
      this.props.endsAt = input.endsAt;
    }
    if (input.maxRedemptions !== undefined) {
      this.props.maxRedemptions = input.maxRedemptions;
    }
    if (input.applicableProductIds !== undefined) {
      this.props.applicableProductIds = normalizeProductIds(input.applicableProductIds);
    }
  }

  toProps(): CouponProps {
    return { ...this.props, applicableProductIds: this.props.applicableProductIds };
  }
}

function normalizeProductIds(productIds: string[] | null): string[] | null {
  if (!productIds || productIds.length === 0) {
    return null;
  }
  return Array.from(new Set(productIds));
}

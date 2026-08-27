import { describe, expect, it } from "vitest";
import { computeCartTotals } from "../../application/cart-pricing";
import { CouponDiscountType } from "../enums/CouponDiscountType";
import { CouponExpiredException } from "../exceptions/CouponExpiredException";
import { InvalidCouponException } from "../exceptions/InvalidCouponException";
import { Coupon, CreateCouponInput } from "./Coupon";

function createCoupon(overrides: Partial<CreateCouponInput> = {}): Coupon {
  return Coupon.create({
    id: "coupon-1",
    code: "verano10",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 10,
    ...overrides,
  });
}

describe("Coupon.create", () => {
  it("normaliza el código a mayúsculas", () => {
    expect(createCoupon({ code: "verano10" }).code).toBe("VERANO10");
  });

  it("no permite un descuento porcentual mayor a 100", () => {
    expect(() =>
      createCoupon({ discountType: CouponDiscountType.PERCENTAGE, discountValue: 150 }),
    ).toThrow(InvalidCouponException);
  });

  it("no permite un valor de descuento <= 0", () => {
    expect(() => createCoupon({ discountValue: 0 })).toThrow(InvalidCouponException);
  });
});

describe("Coupon — restricción por producto ([0061])", () => {
  it("appliesToProduct es true para cualquier producto cuando no hay restricción", () => {
    const coupon = createCoupon({ applicableProductIds: null });
    expect(coupon.appliesToProduct("product-x")).toBe(true);
  });

  it("appliesToProduct respeta la lista cuando sí hay restricción", () => {
    const coupon = createCoupon({ applicableProductIds: ["product-a"] });
    expect(coupon.appliesToProduct("product-a")).toBe(true);
    expect(coupon.appliesToProduct("product-b")).toBe(false);
  });

  it("computeCartTotals aplica el descuento solo sobre las líneas elegibles", () => {
    const coupon = createCoupon({
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10,
      applicableProductIds: ["product-a"],
    });

    const totals = computeCartTotals(
      [
        { productId: "product-a", quantity: 1, unitPrice: 100 },
        { productId: "product-b", quantity: 1, unitPrice: 100 },
      ],
      coupon,
    );

    // Solo el 10% de la línea de product-a (100), no de los 200 del carrito.
    expect(totals.subtotal).toBe(200);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(190);
  });

  it("un cupón de monto fijo no descuenta más de lo que vale la línea elegible", () => {
    const coupon = createCoupon({
      discountType: CouponDiscountType.FIXED_AMOUNT,
      discountValue: 500,
      applicableProductIds: ["product-a"],
    });

    const totals = computeCartTotals(
      [{ productId: "product-a", quantity: 1, unitPrice: 100 }],
      coupon,
    );

    expect(totals.discount).toBe(100);
  });

  it("sin restricción, el cálculo queda igual que antes de [0061] (aplica sobre todo el carrito)", () => {
    const coupon = createCoupon({
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10,
      applicableProductIds: null,
    });

    const totals = computeCartTotals(
      [
        { productId: "product-a", quantity: 1, unitPrice: 100 },
        { productId: "product-b", quantity: 1, unitPrice: 100 },
      ],
      coupon,
    );

    expect(totals.discount).toBe(20);
  });
});

describe("Coupon — update / activate / deactivate", () => {
  it("update no permite cambiar code ni discountType (no expone esos campos)", () => {
    const coupon = createCoupon();
    coupon.update({ discountValue: 20 });

    expect(coupon.code).toBe("VERANO10");
  });

  it("deactivate hace que assertApplicable lance CouponExpiredException", () => {
    const coupon = createCoupon();
    coupon.deactivate();

    expect(() => coupon.assertApplicable(1000, new Date())).toThrow(CouponExpiredException);
  });

  it("activate revierte la desactivación", () => {
    const coupon = createCoupon();
    coupon.deactivate();
    coupon.activate();

    expect(() => coupon.assertApplicable(1000, new Date())).not.toThrow();
  });
});

import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { CouponDiscountType } from "../../../../cart/domain/enums/CouponDiscountType";

export const CreateCouponRequestSchema = z
  .object({
    code: z.string().min(1).max(40),
    discountType: z.nativeEnum(CouponDiscountType),
    discountValue: z.number().positive(),
    minPurchaseAmount: z.number().positive().nullable().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    applicableProductIds: z.array(z.string().uuid()).nullable().optional().openapi({
      description: "[0061]: null = aplica a todo el carrito.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === CouponDiscountType.PERCENTAGE && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un descuento porcentual no puede superar 100.",
        path: ["discountValue"],
      });
    }
  });

export const CreateCouponResponseSchema = z.object({
  code: z.string(),
});

registry.registerPath({
  method: "post",
  path: "/admin/coupons",
  tags: ["admin"],
  summary: "Crear un cupón de descuento (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateCouponRequestSchema } } } },
  responses: {
    201: {
      description: "Cupón creado.",
      content: { "application/json": { schema: CreateCouponResponseSchema } },
    },
  },
});

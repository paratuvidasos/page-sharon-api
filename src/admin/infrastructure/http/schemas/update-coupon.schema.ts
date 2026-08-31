import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

/**
 * [0061]: no incluye `code` ni `discountType` — son inmutables una vez
 * creado el cupón (ver `Coupon.update` en el dominio). `isActive` activa o
 * desactiva en el mismo endpoint, mismo patrón que las zonas de envío.
 */
export const UpdateCouponRequestSchema = z.object({
  discountValue: z.number().positive().optional(),
  minPurchaseAmount: z.number().positive().nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  applicableProductIds: z.array(z.string().uuid()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const CouponCodeParamsSchema = z.object({ code: z.string().min(1).max(40) });

registry.registerPath({
  method: "patch",
  path: "/admin/coupons/{code}",
  tags: ["admin"],
  summary: "Edita un cupón, incluida su activación/desactivación (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: CouponCodeParamsSchema,
    body: { content: { "application/json": { schema: UpdateCouponRequestSchema } } },
  },
  responses: {
    204: { description: "Cupón actualizado." },
    400: { description: "Los datos del cupón no son válidos." },
    404: { description: "El cupón no existe." },
  },
});

import { z } from "zod";
import { CouponDiscountType } from "../../../../cart/domain/enums/CouponDiscountType";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ListCouponsQuerySchema = PaginationQuerySchema;

export const CouponAdminResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: z.nativeEnum(CouponDiscountType),
  discountValue: z.number(),
  minPurchaseAmount: z.number().nullable(),
  startsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  isActive: z.boolean(),
  maxRedemptions: z.number().int().nullable(),
  redemptionsCount: z.number().int(),
  applicableProductIds: z.array(z.string().uuid()).nullable(),
});

export const ListCouponsResponseSchema = paginatedResponseSchema(CouponAdminResponseSchema);

registry.registerPath({
  method: "get",
  path: "/admin/coupons",
  tags: ["admin"],
  summary: "Lista los cupones, con su uso acumulado (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ListCouponsQuerySchema },
  responses: {
    200: {
      description: "Página de cupones, del más reciente al más antiguo.",
      content: { "application/json": { schema: ListCouponsResponseSchema } },
    },
  },
});

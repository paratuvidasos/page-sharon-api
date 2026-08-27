import { z } from "zod";
import { UserStatus } from "../../../../accounts/domain/enums/UserStatus";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

export const ListCustomersQuerySchema = PaginationQuerySchema.extend({
  search: z.string().min(1).max(150).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const CustomerParamsSchema = z.object({ id: z.string().uuid() });

export const CustomerAdminResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  createdAt: z.coerce.date(),
  orderCount: z.number().int().openapi({ description: "[0063]: solo pedidos PAID en adelante." }),
  totalSpent: z.number(),
  lastOrderAt: z.coerce.date().nullable(),
});

export const ListCustomersResponseSchema = paginatedResponseSchema(CustomerAdminResponseSchema);

registry.registerPath({
  method: "get",
  path: "/admin/customers",
  tags: ["admin"],
  summary: "Lista los clientes registrados, con resumen de compras (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ListCustomersQuerySchema },
  responses: {
    200: {
      description: "Página de clientes.",
      content: { "application/json": { schema: ListCustomersResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/customers/{id}/suspend",
  tags: ["admin"],
  summary: "Bloquea temporalmente una cuenta ante actividad sospechosa (solo administradores)",
  description: "También cierra las sesiones activas del cliente de inmediato.",
  security: [{ bearerAuth: [] }],
  request: { params: CustomerParamsSchema },
  responses: {
    204: { description: "Cuenta suspendida." },
    404: { description: "El cliente no existe." },
    409: { description: "La cuenta no puede suspenderse desde su estado actual." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/customers/{id}/reactivate",
  tags: ["admin"],
  summary: "Levanta el bloqueo temporal de una cuenta (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: CustomerParamsSchema },
  responses: {
    204: { description: "Cuenta reactivada." },
    404: { description: "El cliente no existe." },
    409: { description: "La cuenta no puede reactivarse desde su estado actual." },
  },
});

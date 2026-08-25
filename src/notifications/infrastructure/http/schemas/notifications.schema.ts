import { z } from "zod";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { NotificationType } from "../../../domain/enums/NotificationType";

export const NotificationListQuerySchema = PaginationQuerySchema.extend({
  unreadOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
    .openapi({ example: "true", description: "Deja solo las notificaciones sin leer." }),
});

export const NotificationParamsSchema = z.object({ id: z.string().uuid() });

const NotificationItemSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().openapi({ example: "Tu pedido va en camino" }),
  body: z.string().openapi({ example: "Tu pedido salió para tu dirección." }),
  linkUrl: z.string().openapi({
    example: "http://localhost:5190/pedidos/ORD-20260825-AB12CD",
    description: "Enlace directo al detalle del pedido (criterio de [0044]).",
  }),
  orderNumber: z.string().nullable().openapi({ example: "ORD-20260825-AB12CD" }),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const NotificationListResponseSchema = paginatedResponseSchema(NotificationItemSchema).extend({
  unreadCount: z.number().int().openapi({
    example: 3,
    description: "Viene con el listado para que la campana no tenga que pedirlo aparte.",
  }),
});

export const UnreadCountResponseSchema = z.object({ unreadCount: z.number().int() });

export const NotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().openapi({ example: true }),
  inAppEnabled: z.boolean().openapi({ example: true }),
});

/**
 * Los dos campos son opcionales para poder apagar un canal sin tener que
 * repetir el estado del otro. Apagar los dos está permitido: es una decisión
 * del usuario, no un estado inválido.
 */
export const UpdateNotificationPreferencesRequestSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});

registry.registerPath({
  method: "get",
  path: "/notifications",
  tags: ["notifications"],
  summary: "Buzón de notificaciones del usuario autenticado",
  security: [{ bearerAuth: [] }],
  request: { query: NotificationListQuerySchema },
  responses: {
    200: {
      description: "Página de notificaciones, de la más reciente a la más antigua.",
      content: { "application/json": { schema: NotificationListResponseSchema } },
    },
    401: { description: "No autenticado." },
  },
});

registry.registerPath({
  method: "get",
  path: "/notifications/unread-count",
  tags: ["notifications"],
  summary: "Cuántas notificaciones sin leer tiene el usuario",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Contador de no leídas.",
      content: { "application/json": { schema: UnreadCountResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/{id}/read",
  tags: ["notifications"],
  summary: "Marca una notificación como leída",
  security: [{ bearerAuth: [] }],
  request: { params: NotificationParamsSchema },
  responses: {
    204: { description: "Notificación marcada como leída." },
    404: {
      description:
        "La notificación no existe o no es de quien consulta. Se responde igual en ambos casos.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/notifications/read-all",
  tags: ["notifications"],
  summary: "Marca todas las notificaciones del usuario como leídas",
  security: [{ bearerAuth: [] }],
  responses: { 204: { description: "Notificaciones marcadas como leídas." } },
});

registry.registerPath({
  method: "get",
  path: "/notifications/preferences",
  tags: ["notifications"],
  summary: "Por qué canales quiere recibir avisos el usuario",
  description:
    "[0044]: quien nunca las configuró recibe los valores por defecto (ambos canales encendidos) sin que se cree ninguna fila.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Preferencias vigentes.",
      content: { "application/json": { schema: NotificationPreferencesSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/notifications/preferences",
  tags: ["notifications"],
  summary: "Cambia los canales por los que el usuario recibe avisos",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: UpdateNotificationPreferencesRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Preferencias actualizadas.",
      content: { "application/json": { schema: NotificationPreferencesSchema } },
    },
  },
});

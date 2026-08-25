import { z } from "zod";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";
import { PaymentStatus } from "../../../domain/enums/PaymentStatus";

export const PaymentStatusResponseSchema = z.object({
  referenceId: z.string().openapi({ example: "ORD-20260824-AB12CD-9F3E7A21" }),
  status: z.nativeEnum(PaymentStatus),
  message: z.string().nullable().openapi({
    example: "Tu banco rechazó la transacción. Intenta con otra tarjeta u otro método de pago.",
    description: "Mensaje apto para mostrarle al usuario. Nunca es el texto crudo de la pasarela.",
  }),
  settled: z.boolean().openapi({
    description: "true cuando el intento ya no va a cambiar de estado y se puede dejar de consultar.",
  }),
});

registry.registerPath({
  method: "get",
  path: "/payments/{referenceId}/status",
  tags: ["payments"],
  summary: "Consulta el estado de un intento de pago",
  description:
    "Respaldo para la pantalla de resultado: el comprador vuelve del redirect antes de que llegue el webhook. Si la pasarela ya tiene un resultado final, se aplica aquí.",
  request: { params: z.object({ referenceId: z.string() }) },
  responses: {
    200: {
      description: "Estado actual del intento de pago.",
      content: { "application/json": { schema: PaymentStatusResponseSchema } },
    },
    404: { description: "No existe un intento de pago con esa referencia." },
  },
});

registry.registerPath({
  method: "post",
  path: "/payments/bold/webhook",
  tags: ["payments"],
  summary: "Recibe las notificaciones de transacción de Bold",
  description:
    "Endpoint para Bold, no para el frontend. Verifica el header `x-bold-signature` (HMAC-SHA256 del body en base64) y es idempotente por id de pago: Bold reintenta hasta 5 veces y puede reenviar un evento ya procesado.",
  responses: {
    200: { description: "Evento recibido. Se responde 200 incluso si se descartó por repetido." },
    401: { description: "Firma inválida: no se ejecuta ninguna lógica de negocio." },
  },
});

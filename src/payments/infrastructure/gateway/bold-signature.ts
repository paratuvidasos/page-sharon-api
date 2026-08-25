import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma de integridad del Botón de Pagos de Bold.
 *
 * `SHA256("{orderId}{amount}{currency}{secretKey}")`, concatenado en ese
 * orden exacto — cualquier otro orden produce un hash que Bold rechaza.
 *
 * Se calcula acá, en el servidor, y no en el navegador: es lo que Bold
 * recomienda explícitamente, porque generarla en el frontend obligaría a
 * enviarle la llave secreta al cliente.
 */
export function buildIntegritySignature(
  orderId: string,
  amount: number,
  currency: string,
  secretKey: string,
): string {
  return createHash("sha256").update(`${orderId}${amount}${currency}${secretKey}`).digest("hex");
}

/**
 * Verifica el header `x-bold-signature` de un webhook.
 *
 * El algoritmo de Bold es HMAC-SHA256 sobre el body **codificado en base64**
 * (no sobre el body crudo), con la llave secreta, y el resultado en
 * hexadecimal. La comparación es en tiempo constante para no filtrar la
 * firma esperada byte a byte.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secretKey: string,
): boolean {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", secretKey)
    .update(rawBody.toString("base64"))
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature.trim().toLowerCase(), "utf8");

  // timingSafeEqual exige longitudes iguales; una firma de largo distinto ya
  // es inválida, así que se descarta antes de comparar.
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/** Bold espera `data-expiration-date` en nanosegundos desde epoch. */
export function toBoldExpirationDate(date: Date): string {
  return `${BigInt(date.getTime()) * 1_000_000n}`;
}

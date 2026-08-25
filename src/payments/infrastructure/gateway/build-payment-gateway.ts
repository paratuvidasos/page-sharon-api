import { PaymentGatewayPort } from "../../domain/ports/PaymentGatewayPort";
import { BoldPaymentGateway } from "./BoldPaymentGateway";
import { FakePaymentGateway } from "./FakePaymentGateway";

const DEFAULT_STATUS_API_URL = "https://payments.api.bold.co";

/**
 * Elige la pasarela según lo que haya en el entorno — mismo criterio que
 * `build-email-sender.ts`: sin credenciales, una implementación local que no
 * sale a internet.
 *
 * Así el checkout completo ([0038] a [0040]) es probable hoy, antes de que
 * exista la cuenta de Bold. Cuando exista, poner `BOLD_API_KEY` y
 * `BOLD_SECRET_KEY` en el `.env` es lo único que hay que hacer.
 */
export function buildPaymentGateway(): PaymentGatewayPort {
  const apiKey = process.env.BOLD_API_KEY;
  const secretKey = process.env.BOLD_SECRET_KEY;
  const environment = (process.env.BOLD_ENVIRONMENT ?? "sandbox").toLowerCase();
  const isProduction = environment === "production";

  if (!apiKey) {
    if (isProduction) {
      throw new Error(
        "BOLD_API_KEY es obligatorio con BOLD_ENVIRONMENT=production: la pasarela simulada nunca debe cobrar en producción.",
      );
    }
    console.warn(
      "[payments] Sin BOLD_API_KEY: usando la pasarela simulada. Ningún pago es real.",
    );
    return new FakePaymentGateway();
  }

  // En sandbox Bold firma los webhooks con un secreto vacío; en producción un
  // secreto vacío significaría aceptar cualquier webhook, así que se exige.
  if (isProduction && !secretKey) {
    throw new Error("BOLD_SECRET_KEY es obligatorio con BOLD_ENVIRONMENT=production.");
  }

  return new BoldPaymentGateway({
    apiKey,
    secretKey: secretKey ?? "",
    statusApiUrl: process.env.BOLD_STATUS_API_URL ?? DEFAULT_STATUS_API_URL,
    renderMode: process.env.BOLD_CHECKOUT_RENDER_MODE === "redirect" ? "redirect" : "embedded",
    sandbox: !isProduction,
  });
}

/** Ventana que tiene el comprador para completar el pago antes de que expire la referencia. */
export function readPaymentExpirationMinutes(): number {
  const raw = Number(process.env.BOLD_PAYMENT_EXPIRATION_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

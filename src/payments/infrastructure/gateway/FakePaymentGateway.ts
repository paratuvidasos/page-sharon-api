import { PaymentProvider } from "../../domain/enums/PaymentProvider";
import { createHmac } from "node:crypto";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import {
  BuildCheckoutSessionInput,
  GatewayCheckoutSession,
  GatewayEvent,
  GatewayEventType,
  GatewayTransactionStatus,
  PaymentGatewayPort,
  SimulatablePaymentGateway,
} from "../../domain/ports/PaymentGatewayPort";
import { buildIntegritySignature, toBoldExpirationDate, verifyWebhookSignature } from "./bold-signature";

/**
 * Pasarela simulada, activa mientras no haya credenciales de Bold en el
 * entorno. Es el mismo patrón que `ConsoleEmailSender` cuando falta
 * `BREVO_API_KEY`: el sistema arranca y el flujo completo se puede probar,
 * en vez de reventar en el primer checkout.
 *
 * Firma con el mismo algoritmo que Bold y verifica el webhook con el mismo
 * HMAC, así que el camino de código que se prueba en local es el real — lo
 * único que cambia es que no hay una pasarela de verdad al otro lado. El
 * `scriptUrl` queda vacío para que el frontend sepa que debe pintar su
 * pantalla de simulación en vez de cargar el script de Bold.
 */
export class FakePaymentGateway implements PaymentGatewayPort, SimulatablePaymentGateway {
  readonly provider = PaymentProvider.BOLD;
  readonly simulated = true as const;

  private readonly statuses = new Map<string, GatewayTransactionStatus>();

  constructor(private readonly secretKey = "local-dev-secret") {}

  async buildCheckoutSession(input: BuildCheckoutSessionInput): Promise<GatewayCheckoutSession> {
    const amount = Math.round(input.amount);

    this.statuses.set(input.referenceId, {
      referenceId: input.referenceId,
      providerPaymentId: null,
      status: "NO_TRANSACTION_FOUND",
      amount,
      paymentMethod: null,
    });

    return {
      provider: this.provider,
      scriptUrl: "",
      apiKey: "FAKE_LOCAL_API_KEY",
      referenceId: input.referenceId,
      amount,
      currency: input.currency,
      integritySignature: buildIntegritySignature(
        input.referenceId,
        amount,
        input.currency,
        this.secretKey,
      ),
      description: input.description.slice(0, 100),
      redirectionUrl: input.redirectionUrl,
      expirationDate: toBoldExpirationDate(input.expiresAt),
      customerData: JSON.stringify(input.customer),
      billingAddress: JSON.stringify(input.billingAddress),
      renderMode: "redirect",
      sandbox: true,
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    return verifyWebhookSignature(rawBody, signature, this.secretKey);
  }

  parseWebhookEvent(rawBody: Buffer): GatewayEvent {
    const payload = JSON.parse(rawBody.toString("utf8")) as {
      id: string;
      type: GatewayEventType;
      subject: string;
      data?: {
        payment_id?: string;
        bold_code?: string;
        metadata?: { reference?: string };
        amount?: { total?: number };
      };
    };

    const referenceId = payload.data?.metadata?.reference ?? null;
    if (referenceId) {
      this.statuses.set(referenceId, {
        referenceId,
        providerPaymentId: payload.data?.payment_id ?? payload.subject,
        status: payload.type === GatewayEventType.SALE_APPROVED ? "APPROVED" : "REJECTED",
        amount: payload.data?.amount?.total ?? null,
        paymentMethod: null,
      });
    }

    return {
      eventId: payload.id,
      type: payload.type,
      providerPaymentId: payload.data?.payment_id ?? payload.subject,
      referenceId,
      amount: payload.data?.amount?.total ?? null,
      currency: null,
      paymentMethod: null,
      failureCode: payload.data?.bold_code ?? null,
      occurredAt: new Date(),
    };
  }

  /**
   * Fabrica el evento que la pasarela real mandaría por webhook, con su firma
   * válida.
   *
   * Se firma de verdad, con el mismo HMAC, en vez de saltarse la
   * verificación: así una simulación recorre exactamente el mismo camino que
   * un cobro real —verificación de firma, idempotencia, eventos de dominio—
   * y lo que se prueba en local es el código que va a correr en producción.
   */
  buildSimulatedEvent(input: {
    referenceId: string;
    amount: number;
    currency: Currency;
    outcome: GatewayEventType;
    failureCode: string | null;
  }): { rawBody: Buffer; signature: string } {
    // Misma forma CloudEvents 1.0 que usa Bold.
    const payload = {
      id: `sim-${Date.now()}`,
      type: input.outcome,
      subject: `sim-payment-${input.referenceId}`,
      source: "/payments",
      spec_version: "1.0",
      time: `${Date.now() * 1_000_000}`,
      data: {
        payment_id: `sim-payment-${input.referenceId}`,
        amount: { total: input.amount, currency: input.currency },
        bold_code: input.failureCode ?? undefined,
        metadata: { reference: input.referenceId },
      },
      datacontenttype: "application/json",
    };

    const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
    const signature = createHmac("sha256", this.secretKey)
      .update(rawBody.toString("base64"))
      .digest("hex");

    return { rawBody, signature };
  }

  async fetchTransactionStatus(referenceId: string): Promise<GatewayTransactionStatus> {
    return (
      this.statuses.get(referenceId) ?? {
        referenceId,
        providerPaymentId: null,
        status: "NO_TRANSACTION_FOUND",
        amount: null,
        paymentMethod: null,
      }
    );
  }
}

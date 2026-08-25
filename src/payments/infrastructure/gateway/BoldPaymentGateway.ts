import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { PaymentProvider } from "../../domain/enums/PaymentProvider";
import {
  BuildCheckoutSessionInput,
  GatewayCheckoutSession,
  GatewayEvent,
  GatewayEventType,
  GatewayTransactionStatus,
  PaymentGatewayPort,
} from "../../domain/ports/PaymentGatewayPort";
import {
  buildIntegritySignature,
  toBoldExpirationDate,
  verifyWebhookSignature,
} from "./bold-signature";

const BOLD_SCRIPT_URL = "https://checkout.bold.co/library/boldPaymentButton.js";
const DEFAULT_STATUS_API_URL = "https://payments.api.bold.co";

/** `data-description` de Bold: entre 2 y 100 caracteres, y sin URLs. */
const DESCRIPTION_MAX_LENGTH = 100;

export interface BoldPaymentGatewayConfig {
  apiKey: string;
  secretKey: string;
  statusApiUrl: string;
  renderMode: "embedded" | "redirect";
  sandbox: boolean;
}

/**
 * Integración con el **Botón de Pagos** de Bold.
 *
 * Este backend nunca ve datos de tarjeta: firma una referencia, el navegador
 * abre la pasarela alojada por Bold con esa firma, y el resultado vuelve por
 * webhook. Por eso no hay ni un solo campo de tarjeta en toda la clase
 * ([0036]).
 *
 * La `apiKey` (llave de identidad) sí se expone al navegador — es su uso
 * previsto, va en `data-api-key`. La `secretKey` no sale nunca de acá: se usa
 * solo para firmar la integridad y para verificar el HMAC del webhook.
 */
export class BoldPaymentGateway implements PaymentGatewayPort {
  readonly provider = PaymentProvider.BOLD;

  constructor(private readonly config: BoldPaymentGatewayConfig) {}

  async buildCheckoutSession(input: BuildCheckoutSessionInput): Promise<GatewayCheckoutSession> {
    // Bold exige el monto como entero sin decimales.
    const amount = Math.round(input.amount);

    return {
      provider: this.provider,
      scriptUrl: BOLD_SCRIPT_URL,
      apiKey: this.config.apiKey,
      referenceId: input.referenceId,
      amount,
      currency: input.currency,
      integritySignature: buildIntegritySignature(
        input.referenceId,
        amount,
        input.currency,
        this.config.secretKey,
      ),
      description: truncateDescription(input.description),
      redirectionUrl: input.redirectionUrl,
      expirationDate: toBoldExpirationDate(input.expiresAt),
      customerData: JSON.stringify({
        email: input.customer.email,
        fullName: input.customer.fullName,
        phone: input.customer.phone ?? undefined,
        documentNumber: input.customer.documentNumber ?? undefined,
      }),
      billingAddress: JSON.stringify(input.billingAddress),
      renderMode: this.config.renderMode,
      sandbox: this.config.sandbox,
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    return verifyWebhookSignature(rawBody, signature, this.config.secretKey);
  }

  parseWebhookEvent(rawBody: Buffer): GatewayEvent {
    // Formato CloudEvents 1.0: los metadatos van arriba y el detalle de la
    // transacción dentro de `data`.
    const envelope = JSON.parse(rawBody.toString("utf8")) as BoldWebhookEnvelope;
    const data = envelope.data ?? ({} as BoldWebhookData);

    return {
      eventId: envelope.id,
      type: envelope.type as GatewayEventType,
      providerPaymentId: data.payment_id ?? envelope.subject,
      referenceId: data.metadata?.reference ?? null,
      amount: data.amount?.total ?? null,
      currency: toCurrency(data.amount?.currency),
      paymentMethod: toPaymentMethod(data.payment_method),
      failureCode: data.bold_code ?? null,
      // `time` viene en nanosegundos; Date trabaja en milisegundos.
      occurredAt: parseBoldTime(envelope.time),
    };
  }

  async fetchTransactionStatus(referenceId: string): Promise<GatewayTransactionStatus> {
    const response = await fetch(
      `${this.config.statusApiUrl}/v2/payment-voucher/${encodeURIComponent(referenceId)}`,
      { headers: { Authorization: `x-api-key ${this.config.apiKey}` } },
    );

    if (response.status === 404) {
      return emptyStatus(referenceId);
    }

    if (!response.ok) {
      throw new Error(`Bold respondió ${response.status} al consultar la transacción ${referenceId}.`);
    }

    const body = (await response.json()) as BoldVoucherResponse;

    return {
      referenceId,
      providerPaymentId: body.transaction_id ?? null,
      status: body.payment_status ?? "NO_TRANSACTION_FOUND",
      amount: body.total ?? null,
      paymentMethod: toPaymentMethod(body.payment_method),
    };
  }
}

function emptyStatus(referenceId: string): GatewayTransactionStatus {
  return {
    referenceId,
    providerPaymentId: null,
    status: "NO_TRANSACTION_FOUND",
    amount: null,
    paymentMethod: null,
  };
}

function truncateDescription(description: string): string {
  return description.length <= DESCRIPTION_MAX_LENGTH
    ? description
    : `${description.slice(0, DESCRIPTION_MAX_LENGTH - 1)}…`;
}

function parseBoldTime(time: string | number | undefined): Date {
  if (time == null) {
    return new Date();
  }
  const asNumber = Number(time);
  if (Number.isFinite(asNumber)) {
    return new Date(Math.floor(asNumber / 1_000_000));
  }
  const parsed = new Date(time);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toCurrency(value: string | undefined): Currency | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return upper in Currency ? (upper as Currency) : null;
}

/**
 * Bold reporta el método con sus propios nombres; se traducen al enum del
 * dominio para no dejar "magic strings" de la pasarela dentro del negocio
 * (ver sección "Enums" del CLAUDE.md del repo).
 */
const BOLD_PAYMENT_METHODS: Record<string, PaymentMethod> = {
  CREDIT_CARD: PaymentMethod.CREDIT_CARD,
  DEBIT_CARD: PaymentMethod.DEBIT_CARD,
  PSE: PaymentMethod.PSE,
  NEQUI: PaymentMethod.NEQUI,
  BANCOLOMBIA: PaymentMethod.BANCOLOMBIA_BUTTON,
  BOTON_BANCOLOMBIA: PaymentMethod.BANCOLOMBIA_BUTTON,
  BANCOLOMBIA_BUTTON: PaymentMethod.BANCOLOMBIA_BUTTON,
};

function toPaymentMethod(value: string | undefined): PaymentMethod | null {
  if (!value) return null;
  return BOLD_PAYMENT_METHODS[value.toUpperCase()] ?? null;
}

interface BoldWebhookAmount {
  currency?: string;
  total?: number;
}

interface BoldWebhookData {
  payment_id?: string;
  amount?: BoldWebhookAmount;
  bold_code?: string;
  payer_email?: string;
  payment_method?: string;
  metadata?: { reference?: string };
}

interface BoldWebhookEnvelope {
  id: string;
  type: string;
  subject: string;
  time?: string | number;
  data?: BoldWebhookData;
}

interface BoldVoucherResponse {
  transaction_id?: string;
  total?: number;
  reference_id?: string;
  payment_method?: string;
  payment_status?: GatewayTransactionStatus["status"];
}

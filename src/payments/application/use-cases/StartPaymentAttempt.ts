import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { PaymentAttempt } from "../../domain/entities/PaymentAttempt";
import { PaymentMethodNotAvailableException } from "../../domain/exceptions/PaymentMethodNotAvailableException";
import { isPaymentMethodAvailable } from "../../domain/payment-method-catalog";
import {
  GatewayBillingAddress,
  GatewayCheckoutSession,
  GatewayCustomer,
  PaymentGatewayPort,
} from "../../domain/ports/PaymentGatewayPort";
import { PaymentAttemptRepository } from "../../domain/repositories/PaymentAttemptRepository";
import { generatePaymentReference } from "../payment-reference";

export interface StartPaymentAttemptInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description: string;
  customer: GatewayCustomer;
  billingAddress: GatewayBillingAddress;
}

export interface StartPaymentAttemptResult {
  attemptId: string;
  referenceId: string;
  expiresAt: Date;
  session: GatewayCheckoutSession;
}

/**
 * [0036]: arranca un intento de cobro y devuelve, ya firmados, los parámetros
 * que el navegador necesita para abrir la pasarela.
 *
 * Ningún dato sensible entra ni sale de acá: la tarjeta se digita dentro de
 * la pasarela de Bold, no en nuestro dominio. Lo que sí se hace en servidor es
 * la firma de integridad, para que el monto no se pueda alterar desde el
 * cliente sin invalidarla.
 */
export class StartPaymentAttempt {
  constructor(
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly expirationMinutes: number,
  ) {}

  async execute(input: StartPaymentAttemptInput): Promise<StartPaymentAttemptResult> {
    if (!isPaymentMethodAvailable(input.paymentMethod, input.billingAddress.country, input.currency)) {
      throw new PaymentMethodNotAvailableException();
    }

    const referenceId = generatePaymentReference(input.orderNumber);
    const expiresAt = new Date(Date.now() + this.expirationMinutes * 60_000);

    const attempt = PaymentAttempt.create({
      id: generateId(),
      orderId: input.orderId,
      referenceId,
      provider: this.paymentGateway.provider,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      expiresAt,
    });

    // Se persiste antes de firmar: si el proceso se cae justo después de que
    // el comprador abra la pasarela, el webhook tiene que encontrar la
    // referencia. Un intento huérfano expira solo; un pago sin intento
    // registrado no se podría conciliar con ningún pedido.
    await this.paymentAttemptRepository.save(attempt);

    const session = await this.paymentGateway.buildCheckoutSession({
      referenceId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      redirectionUrl: buildRedirectionUrl(input.orderNumber),
      expiresAt,
      customer: input.customer,
      billingAddress: input.billingAddress,
    });

    return { attemptId: attempt.id, referenceId, expiresAt, session };
  }
}

/**
 * A dónde vuelve el comprador al salir de la pasarela. Bold le agrega
 * `?bold-order-id=...&bold-tx-status=...`, que sirven como pista de UI pero
 * no como fuente de verdad: vienen del navegador. El número de pedido va en
 * la URL para que esa pantalla pueda confirmar el estado real contra la API.
 */
function buildRedirectionUrl(orderNumber: string): string {
  const base = process.env.CHECKOUT_RESULT_URL ?? "http://localhost:5190/checkout/resultado";
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}order=${encodeURIComponent(orderNumber)}`;
}

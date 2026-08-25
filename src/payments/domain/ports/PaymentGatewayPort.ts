import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { PaymentMethod } from "../../../shared-kernel/domain/enums/PaymentMethod";
import { PaymentProvider } from "../enums/PaymentProvider";

export interface GatewayCustomer {
  email: string;
  fullName: string;
  phone: string | null;
  documentNumber: string | null;
}

export interface GatewayBillingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BuildCheckoutSessionInput {
  referenceId: string;
  amount: number;
  currency: Currency;
  description: string;
  redirectionUrl: string;
  expiresAt: Date;
  customer: GatewayCustomer;
  billingAddress: GatewayBillingAddress;
}

/**
 * Todo lo que el navegador necesita para abrir la pasarela. Se devuelve tal
 * cual al frontend: la firma ya viene calculada, así que el cliente no puede
 * alterar el monto sin invalidarla.
 */
export interface GatewayCheckoutSession {
  provider: PaymentProvider;
  scriptUrl: string;
  /** Llave de identidad. Es pública por diseño — la secreta nunca sale de aquí. */
  apiKey: string;
  referenceId: string;
  amount: number;
  currency: Currency;
  integritySignature: string;
  description: string;
  redirectionUrl: string;
  /** Nanosegundos desde epoch: el formato que exige Bold en `data-expiration-date`. */
  expirationDate: string;
  customerData: string;
  billingAddress: string;
  renderMode: "embedded" | "redirect";
  /** true cuando corre el gateway simulado local (sin credenciales configuradas). */
  sandbox: boolean;
}

export enum GatewayEventType {
  SALE_APPROVED = "SALE_APPROVED",
  SALE_REJECTED = "SALE_REJECTED",
  VOID_APPROVED = "VOID_APPROVED",
  VOID_REJECTED = "VOID_REJECTED",
}

export interface GatewayEvent {
  /** Id del evento en la pasarela. Distinto del id del pago. */
  eventId: string;
  type: GatewayEventType;
  providerPaymentId: string;
  /** La referencia que nosotros generamos y le enviamos a la pasarela. */
  referenceId: string | null;
  amount: number | null;
  currency: Currency | null;
  paymentMethod: PaymentMethod | null;
  failureCode: string | null;
  occurredAt: Date;
}

export interface GatewayTransactionStatus {
  referenceId: string;
  providerPaymentId: string | null;
  /** Estado crudo de la pasarela, ya normalizado a los valores que conoce el dominio. */
  status:
    | "NO_TRANSACTION_FOUND"
    | "PROCESSING"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "FAILED"
    | "VOIDED";
  amount: number | null;
  paymentMethod: PaymentMethod | null;
}

/**
 * [0036]: puerto que aísla la pasarela de pago del resto del sistema.
 *
 * Existe para que ningún caso de uso sepa que la pasarela es Bold: cambiarla
 * (o pasar del Botón de Pagos a la API server-side) debería ser escribir otra
 * implementación de esta interfaz y nada más.
 *
 * Ninguno de estos métodos recibe datos de tarjeta, y es a propósito: con el
 * Botón de Pagos los datos sensibles van del navegador a la pasarela sin
 * pasar por este backend, que es exactamente el criterio de aceptación de
 * [0036].
 */
export interface PaymentGatewayPort {
  readonly provider: PaymentProvider;

  /** Firma y arma los parámetros de una sesión de pago. No cobra nada todavía. */
  buildCheckoutSession(input: BuildCheckoutSessionInput): Promise<GatewayCheckoutSession>;

  /**
   * Verifica que el webhook venga de verdad de la pasarela. Recibe el body
   * **crudo**: recalcular la firma sobre el JSON re-serializado da un
   * resultado distinto por diferencias de espaciado o de orden de llaves.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean;

  parseWebhookEvent(rawBody: Buffer): GatewayEvent;

  /**
   * Consulta directa a la pasarela. Es el respaldo para cuando el comprador
   * vuelve del redirect antes de que llegue el webhook.
   */
  fetchTransactionStatus(referenceId: string): Promise<GatewayTransactionStatus>;
}

/**
 * Capacidad extra que solo tiene la pasarela simulada: fabricar un evento
 * firmado como si lo hubiera mandado la pasarela de verdad.
 *
 * Se declara aparte de `PaymentGatewayPort` a propósito. Poder decidir por
 * API que un pago quedó aprobado es exactamente lo que una pasarela real
 * nunca debe permitir, así que no forma parte del contrato general: quien
 * quiera usarla tiene que comprobar antes, con `isSimulatable`, que la
 * implementación activa la soporta.
 */
export interface SimulatablePaymentGateway {
  readonly simulated: true;

  buildSimulatedEvent(input: {
    referenceId: string;
    amount: number;
    currency: Currency;
    outcome: GatewayEventType;
    failureCode: string | null;
  }): { rawBody: Buffer; signature: string };
}

export function isSimulatable(
  gateway: PaymentGatewayPort,
): gateway is PaymentGatewayPort & SimulatablePaymentGateway {
  return (gateway as Partial<SimulatablePaymentGateway>).simulated === true;
}

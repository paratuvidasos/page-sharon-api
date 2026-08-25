import { PaymentAttemptNotFoundException } from "../../domain/exceptions/PaymentAttemptNotFoundException";
import { PaymentSimulationNotAvailableException } from "../../domain/exceptions/PaymentSimulationNotAvailableException";
import {
  GatewayEventType,
  isSimulatable,
  PaymentGatewayPort,
} from "../../domain/ports/PaymentGatewayPort";
import { PaymentAttemptRepository } from "../../domain/repositories/PaymentAttemptRepository";
import { HandleGatewayWebhook, HandleGatewayWebhookResult } from "./HandleGatewayWebhook";

export interface SimulatePaymentInput {
  referenceId: string;
  outcome: GatewayEventType;
  failureCode: string | null;
}

/**
 * Resuelve un pago simulado, para poder probar el checkout completo
 * ([0038] a [0040]) sin cuenta de Bold.
 *
 * No toca el pedido ni el intento por su cuenta: fabrica el mismo webhook
 * firmado que mandaría la pasarela y lo pasa por `HandleGatewayWebhook`. Así
 * la simulación ejerce el camino real —verificación de firma, idempotencia,
 * publicación de eventos— en vez de un atajo que se comportaría distinto el
 * día que entre un cobro de verdad.
 *
 * Solo existe mientras la pasarela activa sea la simulada; con credenciales
 * de Bold configuradas responde 404.
 */
export class SimulatePayment {
  constructor(
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly handleGatewayWebhook: HandleGatewayWebhook,
  ) {}

  async execute(input: SimulatePaymentInput): Promise<HandleGatewayWebhookResult> {
    if (!isSimulatable(this.paymentGateway)) {
      throw new PaymentSimulationNotAvailableException();
    }

    // El monto sale del intento persistido y no del cuerpo de la petición:
    // `HandleGatewayWebhook` rechaza una aprobación cuyo monto no coincida
    // con el firmado, y esa comprobación tiene que seguir teniendo sentido
    // también cuando el pago es simulado.
    const attempt = await this.paymentAttemptRepository.findByReferenceId(input.referenceId);
    if (!attempt) {
      throw new PaymentAttemptNotFoundException();
    }

    const { rawBody, signature } = this.paymentGateway.buildSimulatedEvent({
      referenceId: attempt.referenceId,
      amount: attempt.amount,
      currency: attempt.currency,
      outcome: input.outcome,
      failureCode: input.failureCode,
    });

    return this.handleGatewayWebhook.execute({ rawBody, signature });
  }
}

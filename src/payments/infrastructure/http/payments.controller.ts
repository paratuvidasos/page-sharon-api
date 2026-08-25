import { Request, Response } from "express";
import { GetPaymentStatus } from "../../application/use-cases/GetPaymentStatus";
import { HandleGatewayWebhook } from "../../application/use-cases/HandleGatewayWebhook";
import { ListPaymentMethods } from "../../application/use-cases/ListPaymentMethods";
import { SimulatePayment } from "../../application/use-cases/SimulatePayment";
import { ListPaymentMethodsQuerySchema } from "./schemas/payment-methods.schema";
import { SimulatePaymentRequestSchema } from "./schemas/simulate-payment.schema";

export class PaymentsController {
  constructor(
    private readonly listPaymentMethods: ListPaymentMethods,
    private readonly handleGatewayWebhook: HandleGatewayWebhook,
    private readonly getPaymentStatus: GetPaymentStatus,
    private readonly simulatePayment: SimulatePayment,
  ) {}

  listMethods = async (req: Request, res: Response): Promise<void> => {
    const query = ListPaymentMethodsQuerySchema.parse(req.query);
    res.status(200).json(await this.listPaymentMethods.execute(query));
  };

  /**
   * `req.body` acá es un Buffer, no un objeto: la ruta monta
   * `express.raw()` porque el HMAC se calcula sobre el body crudo. Volver a
   * serializar el JSON cambiaría espaciado y orden de llaves, y la firma
   * dejaría de coincidir.
   */
  boldWebhook = async (req: Request, res: Response): Promise<void> => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const signature = req.header("x-bold-signature") ?? undefined;

    const result = await this.handleGatewayWebhook.execute({ rawBody, signature });

    // Siempre 200 cuando la firma es válida, incluso si el evento se
    // descartó: Bold exige respuesta en menos de 2s y reintenta durante 24h
    // ante un error, y reintentar un duplicado no arregla nada.
    res.status(200).json(result);
  };

  /**
   * Solo disponible con la pasarela simulada; con Bold configurado el caso de
   * uso responde 404.
   */
  simulate = async (req: Request, res: Response): Promise<void> => {
    const input = SimulatePaymentRequestSchema.parse(req.body);
    const result = await this.simulatePayment.execute({
      referenceId: input.referenceId,
      outcome: input.outcome,
      failureCode: input.failureCode ?? null,
    });
    res.status(200).json(result);
  };

  status = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getPaymentStatus.execute({ referenceId: req.params.referenceId });

    if (!result) {
      res.status(404).json({
        error: "PAYMENT_ATTEMPT_NOT_FOUND",
        message: "No encontramos un intento de pago con esa referencia.",
      });
      return;
    }

    res.status(200).json(result);
  };
}

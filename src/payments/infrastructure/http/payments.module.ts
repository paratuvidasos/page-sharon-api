import { Router } from "express";
import { DataSource } from "typeorm";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { GetPaymentStatus } from "../../application/use-cases/GetPaymentStatus";
import { HandleGatewayWebhook } from "../../application/use-cases/HandleGatewayWebhook";
import { ListPaymentMethods } from "../../application/use-cases/ListPaymentMethods";
import { SimulatePayment } from "../../application/use-cases/SimulatePayment";
import { StartPaymentAttempt } from "../../application/use-cases/StartPaymentAttempt";
import {
  buildPaymentGateway,
  readPaymentExpirationMinutes,
} from "../gateway/build-payment-gateway";
import { TypeOrmPaymentAttemptRepository } from "../persistence/typeorm-payment-attempt.repository";
import { PaymentsController } from "./payments.controller";
import { buildPaymentsRoutes } from "./payments.routes";

export interface PaymentsModule {
  router: Router;
  /** Puerto que `orders` consume para arrancar el cobro de un pedido. */
  startPaymentAttempt: StartPaymentAttempt;
}

export function buildPaymentsModule(dataSource: DataSource): PaymentsModule {
  const paymentAttemptRepository = new TypeOrmPaymentAttemptRepository(dataSource);
  const paymentGateway = buildPaymentGateway();

  const startPaymentAttempt = new StartPaymentAttempt(
    paymentAttemptRepository,
    paymentGateway,
    readPaymentExpirationMinutes(),
  );
  const listPaymentMethods = new ListPaymentMethods();
  const handleGatewayWebhook = new HandleGatewayWebhook(
    paymentAttemptRepository,
    paymentGateway,
    domainEventBus,
  );
  const getPaymentStatus = new GetPaymentStatus(
    paymentAttemptRepository,
    paymentGateway,
    domainEventBus,
  );

  const simulatePayment = new SimulatePayment(
    paymentAttemptRepository,
    paymentGateway,
    handleGatewayWebhook,
  );

  const controller = new PaymentsController(
    listPaymentMethods,
    handleGatewayWebhook,
    getPaymentStatus,
    simulatePayment,
  );

  return {
    router: buildPaymentsRoutes(controller),
    startPaymentAttempt,
  };
}

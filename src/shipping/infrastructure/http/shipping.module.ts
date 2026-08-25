import { Router } from "express";
import { DataSource } from "typeorm";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { GetShippingOptions } from "../../application/use-cases/GetShippingOptions";
import { QuoteShippingMethod } from "../../application/use-cases/QuoteShippingMethod";
import { TypeOrmShippingRateQueryRepository } from "../persistence/typeorm-shipping-rate-query.repository";
import { ShippingController } from "./shipping.controller";
import { buildShippingRoutes } from "./shipping.routes";

export interface ShippingModule {
  router: Router;
  /** Puerto que `orders` consume para recotizar el envío durante el checkout. */
  quoteShippingMethod: QuoteShippingMethod;
}

export function buildShippingModule(
  dataSource: DataSource,
  exchangeRateProvider: ExchangeRateProvider,
): ShippingModule {
  const shippingRateQueryRepository = new TypeOrmShippingRateQueryRepository(dataSource);
  const getShippingOptions = new GetShippingOptions(shippingRateQueryRepository, exchangeRateProvider);
  const quoteShippingMethod = new QuoteShippingMethod(getShippingOptions);
  const controller = new ShippingController(getShippingOptions);

  return {
    router: buildShippingRoutes(controller),
    quoteShippingMethod,
  };
}

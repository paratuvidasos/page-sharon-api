import { Router } from "express";
import { DataSource } from "typeorm";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { CheckShippingRestrictions } from "../../application/use-cases/CheckShippingRestrictions";
import { CreateShippingZone } from "../../application/use-cases/CreateShippingZone";
import { DeleteShippingZone } from "../../application/use-cases/DeleteShippingZone";
import { GetShippingOptions } from "../../application/use-cases/GetShippingOptions";
import { ListShippingCoverage } from "../../application/use-cases/ListShippingCoverage";
import { ListShippingZones } from "../../application/use-cases/ListShippingZones";
import { QuoteShippingMethod } from "../../application/use-cases/QuoteShippingMethod";
import { ProductParcelPort } from "../../application/ports/ProductParcelPort";
import { SetZoneProductRestrictions } from "../../application/use-cases/SetZoneProductRestrictions";
import { UpdateShippingZone } from "../../application/use-cases/UpdateShippingZone";
import { buildCarrierRateProvider } from "../carrier/build-carrier-rate-provider";
import { TypeOrmShippingRateQueryRepository } from "../persistence/typeorm-shipping-rate-query.repository";
import { TypeOrmShippingZoneQueryRepository } from "../persistence/typeorm-shipping-zone-query.repository";
import { TypeOrmShippingZoneRepository } from "../persistence/typeorm-shipping-zone.repository";
import { ShippingController } from "./shipping.controller";
import { buildShippingRoutes } from "./shipping.routes";

export interface ShippingModule {
  router: Router;
  /** Puerto que `orders` consume para recotizar el envío durante el checkout. */
  quoteShippingMethod: QuoteShippingMethod;
  /** [0049]: puerto que `orders` consume para cortar un pedido con productos restringidos. */
  checkShippingRestrictions: CheckShippingRestrictions;
  /**
   * [0049]: casos de uso que monta el módulo `admin`. Se exponen desde acá y
   * no se le entrega el repositorio: `admin` llama casos de uso de otros
   * módulos, nunca su infraestructura (regla 2 del CLAUDE.md del repo).
   */
  createShippingZone: CreateShippingZone;
  updateShippingZone: UpdateShippingZone;
  deleteShippingZone: DeleteShippingZone;
  listShippingZones: ListShippingZones;
  setZoneProductRestrictions: SetZoneProductRestrictions;
}

export function buildShippingModule(
  dataSource: DataSource,
  exchangeRateProvider: ExchangeRateProvider,
  productParcelPort: ProductParcelPort,
): ShippingModule {
  const shippingRateQueryRepository = new TypeOrmShippingRateQueryRepository(dataSource);
  const shippingZoneRepository = new TypeOrmShippingZoneRepository(dataSource);
  const shippingZoneQueryRepository = new TypeOrmShippingZoneQueryRepository(dataSource);

  const getShippingOptions = new GetShippingOptions(
    shippingRateQueryRepository,
    exchangeRateProvider,
    buildCarrierRateProvider(),
    productParcelPort,
  );
  const quoteShippingMethod = new QuoteShippingMethod(getShippingOptions);
  const checkShippingRestrictions = new CheckShippingRestrictions(shippingRateQueryRepository);

  const controller = new ShippingController(
    getShippingOptions,
    new ListShippingCoverage(shippingZoneQueryRepository),
  );

  return {
    router: buildShippingRoutes(controller),
    quoteShippingMethod,
    checkShippingRestrictions,
    createShippingZone: new CreateShippingZone(shippingZoneRepository),
    updateShippingZone: new UpdateShippingZone(shippingZoneRepository),
    deleteShippingZone: new DeleteShippingZone(shippingZoneRepository),
    listShippingZones: new ListShippingZones(shippingZoneQueryRepository),
    setZoneProductRestrictions: new SetZoneProductRestrictions(shippingZoneRepository),
  };
}

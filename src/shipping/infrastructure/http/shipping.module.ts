import { Router } from "express";
import { DataSource } from "typeorm";
import { OrderStatusChanged } from "../../../shared-kernel/domain/events/OrderStatusChanged";
import { ExchangeRateProvider } from "../../../shared-kernel/domain/ports/ExchangeRateProvider";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { CheckShippingRestrictions } from "../../application/use-cases/CheckShippingRestrictions";
import { CreateShippingZone } from "../../application/use-cases/CreateShippingZone";
import { DeleteShippingZone } from "../../application/use-cases/DeleteShippingZone";
import { GetShipmentTrackingByOrderId } from "../../application/use-cases/GetShipmentTrackingByOrderId";
import { GetShippingOptions } from "../../application/use-cases/GetShippingOptions";
import { ListShippingCoverage } from "../../application/use-cases/ListShippingCoverage";
import { GetShippingZoneById } from "../../application/use-cases/GetShippingZoneById";
import { ListShippingZones } from "../../application/use-cases/ListShippingZones";
import { QuoteShippingMethod } from "../../application/use-cases/QuoteShippingMethod";
import { RegisterShipmentTracking } from "../../application/use-cases/RegisterShipmentTracking";
import { ProductParcelPort } from "../../application/ports/ProductParcelPort";
import { SetZoneProductRestrictions } from "../../application/use-cases/SetZoneProductRestrictions";
import { SyncShipmentTrackingUpdates } from "../../application/use-cases/SyncShipmentTrackingUpdates";
import { UpdateShippingZone } from "../../application/use-cases/UpdateShippingZone";
import { buildCarrierRateProvider } from "../carrier/build-carrier-rate-provider";
import { buildShipmentTrackingProvider } from "../carrier/build-shipment-tracking-provider";
import { TypeOrmShipmentTrackingRepository } from "../persistence/typeorm-shipment-tracking.repository";
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
  getShippingZoneById: GetShippingZoneById;
  setZoneProductRestrictions: SetZoneProductRestrictions;
  /** Tracking real con Track123: expuesto para `admin` (lectura) y para el cron (sync). */
  registerShipmentTracking: RegisterShipmentTracking;
  getShipmentTrackingByOrderId: GetShipmentTrackingByOrderId;
  syncShipmentTrackingUpdates: SyncShipmentTrackingUpdates;
}

export function buildShippingModule(
  dataSource: DataSource,
  exchangeRateProvider: ExchangeRateProvider,
  productParcelPort: ProductParcelPort,
): ShippingModule {
  const shippingRateQueryRepository = new TypeOrmShippingRateQueryRepository(dataSource);
  const shippingZoneRepository = new TypeOrmShippingZoneRepository(dataSource);
  const shippingZoneQueryRepository = new TypeOrmShippingZoneQueryRepository(dataSource);
  const shipmentTrackingRepository = new TypeOrmShipmentTrackingRepository(dataSource);
  const shipmentTrackingProvider = buildShipmentTrackingProvider();

  const getShippingOptions = new GetShippingOptions(
    shippingRateQueryRepository,
    exchangeRateProvider,
    buildCarrierRateProvider(),
    productParcelPort,
  );
  const quoteShippingMethod = new QuoteShippingMethod(getShippingOptions);
  const checkShippingRestrictions = new CheckShippingRestrictions(shippingRateQueryRepository);

  const registerShipmentTracking = new RegisterShipmentTracking(
    shipmentTrackingRepository,
    shipmentTrackingProvider,
  );

  // Registra el tracking en Track123 cuando el admin despacha un pedido —
  // se suscribe acá, en el composition root de `shipping`, sin que `orders`
  // sepa que este módulo existe (reglas 2 y 3 del CLAUDE.md del repo), mismo
  // patrón que ya usa `notifications.module.ts` para el mismo evento.
  domainEventBus.subscribe(OrderStatusChanged.eventName, async (event) => {
    const changed = event as OrderStatusChanged;
    if (changed.status !== "SHIPPED" || !changed.trackingNumber || !changed.carrierCode) {
      return;
    }
    await registerShipmentTracking.execute({
      orderId: changed.orderId,
      carrierCode: changed.carrierCode,
      trackingNumber: changed.trackingNumber,
    });
  });

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
    getShippingZoneById: new GetShippingZoneById(shippingZoneQueryRepository),
    setZoneProductRestrictions: new SetZoneProductRestrictions(shippingZoneRepository),
    registerShipmentTracking,
    getShipmentTrackingByOrderId: new GetShipmentTrackingByOrderId(shipmentTrackingRepository),
    syncShipmentTrackingUpdates: new SyncShipmentTrackingUpdates(
      shipmentTrackingRepository,
      shipmentTrackingProvider,
    ),
  };
}

import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { ShipmentTracking } from "../../domain/entities/ShipmentTracking";
import { ShipmentTrackingProviderPort } from "../../domain/ports/ShipmentTrackingProviderPort";
import { ShipmentTrackingRepository } from "../../domain/repositories/ShipmentTrackingRepository";

export interface RegisterShipmentTrackingInput {
  orderId: string;
  carrierCode: string;
  trackingNumber: string;
}

/**
 * Se dispara cuando un pedido pasa a `SHIPPED` (suscripción a
 * `OrderStatusChanged` en `shipping.module.ts`). Guarda el registro local
 * primero: aunque el proveedor esté caído, el pedido queda con su tracking
 * propio y el próximo ciclo de sync puede reintentar sin perder nada.
 */
export class RegisterShipmentTracking {
  constructor(
    private readonly shipmentTrackingRepository: ShipmentTrackingRepository,
    private readonly shipmentTrackingProvider: ShipmentTrackingProviderPort,
  ) {}

  async execute(input: RegisterShipmentTrackingInput): Promise<void> {
    const tracking = ShipmentTracking.register({
      id: generateId(),
      orderId: input.orderId,
      carrierCode: input.carrierCode,
      trackingNumber: input.trackingNumber,
      createdAt: new Date(),
    });

    await this.shipmentTrackingRepository.save(tracking);

    await this.shipmentTrackingProvider.register({
      trackingNumber: tracking.trackingNumber,
      carrierCode: tracking.carrierCode,
    });
  }
}

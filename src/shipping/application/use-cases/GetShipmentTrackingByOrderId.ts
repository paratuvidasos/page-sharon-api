import { ShipmentTrackingStatus } from "../../domain/enums/ShipmentTrackingStatus";
import { ShipmentTrackingNotFoundException } from "../../domain/exceptions/ShipmentTrackingNotFoundException";
import { ShipmentTrackingRepository } from "../../domain/repositories/ShipmentTrackingRepository";

export interface ShipmentTrackingEventView {
  status: ShipmentTrackingStatus;
  description: string;
  location: string | null;
  occurredAt: Date;
}

export interface ShipmentTrackingView {
  status: ShipmentTrackingStatus;
  carrierCode: string;
  trackingNumber: string;
  events: ShipmentTrackingEventView[];
  lastSyncedAt: Date | null;
}

/** Detalle de tracking para el panel administrativo. */
export class GetShipmentTrackingByOrderId {
  constructor(private readonly shipmentTrackingRepository: ShipmentTrackingRepository) {}

  async execute(input: { orderId: string }): Promise<ShipmentTrackingView> {
    const tracking = await this.shipmentTrackingRepository.findByOrderId(input.orderId);
    if (!tracking) {
      throw new ShipmentTrackingNotFoundException();
    }

    const props = tracking.toProps();
    return {
      status: props.status,
      carrierCode: props.carrierCode,
      trackingNumber: props.trackingNumber,
      events: props.events,
      lastSyncedAt: props.lastSyncedAt,
    };
  }
}

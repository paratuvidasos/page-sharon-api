export interface ShipmentTrackingEventView {
  status: string;
  description: string;
  location: string | null;
  occurredAt: Date;
}

export interface ShipmentTrackingView {
  status: string;
  carrierCode: string;
  trackingNumber: string;
  events: ShipmentTrackingEventView[];
  lastSyncedAt: Date | null;
}

/**
 * Estado real de la transportadora para un pedido ya despachado. Lo
 * implementa `shipping` con `GetShipmentTrackingByOrderId` — lanza si no
 * hay tracking registrado todavía, y es responsabilidad de quien llama acá
 * (no de este puerto) decidir qué hacer con esa falta de datos.
 */
export interface ShipmentTrackingPort {
  execute(input: { orderId: string }): Promise<ShipmentTrackingView>;
}

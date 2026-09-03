import { ShipmentTracking } from "../entities/ShipmentTracking";
import { ShipmentTrackingStatus } from "../enums/ShipmentTrackingStatus";

/**
 * Puerto de escritura/lectura del agregado `ShipmentTracking` — un registro
 * por pedido, sin hijos propios, así que no hace falta separar un
 * `*QueryRepository` aparte para listados (ver "Repository pattern" del
 * CLAUDE.md del repo).
 */
export interface ShipmentTrackingRepository {
  save(tracking: ShipmentTracking): Promise<void>;

  findByOrderId(orderId: string): Promise<ShipmentTracking | null>;

  /** Todo lo que el cron de sync tiene que volver a consultar: nada en `DELIVERED`. */
  findActive(): Promise<ShipmentTracking[]>;
}

export const ACTIVE_TRACKING_STATUSES: readonly ShipmentTrackingStatus[] = [
  ShipmentTrackingStatus.PENDING,
  ShipmentTrackingStatus.IN_TRANSIT,
  ShipmentTrackingStatus.OUT_FOR_DELIVERY,
  ShipmentTrackingStatus.EXCEPTION,
  ShipmentTrackingStatus.UNKNOWN,
];

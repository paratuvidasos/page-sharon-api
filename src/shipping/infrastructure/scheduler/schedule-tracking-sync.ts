import cron from "node-cron";
import { SyncShipmentTrackingUpdates } from "../../application/use-cases/SyncShipmentTrackingUpdates";

const DEFAULT_CRON_EXPRESSION = "*/30 * * * *";

/**
 * Agenda el barrido periódico de estado real con Track123. Vive en
 * `shipping` (no en `src/index.ts`) porque es infraestructura propia del
 * módulo, igual que `build-shipment-tracking-provider.ts`; `index.ts` solo
 * la invoca después de montar el servidor, mismo patrón que ya usa con
 * `catalog.expireStaleReservations`.
 */
export function scheduleTrackingSync(syncShipmentTrackingUpdates: SyncShipmentTrackingUpdates): void {
  const expression = process.env.TRACKING_SYNC_CRON ?? DEFAULT_CRON_EXPRESSION;

  const task = cron.schedule(expression, () => {
    syncShipmentTrackingUpdates
      .execute()
      .catch((error) => console.error("[shipping] Error al sincronizar tracking con Track123:", error));
  });
  task.unref();
}

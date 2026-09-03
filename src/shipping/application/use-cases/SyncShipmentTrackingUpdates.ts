import { ShipmentTrackingProviderPort } from "../../domain/ports/ShipmentTrackingProviderPort";
import { ShipmentTrackingRepository } from "../../domain/repositories/ShipmentTrackingRepository";

/**
 * Barrido periódico (agendado desde `schedule-tracking-sync.ts`) que trae el
 * estado real de cada tracking activo. Cada registro se procesa en su
 * propio `try/catch`: una guía inválida o un error puntual no debe frenar
 * la sincronización del resto del lote.
 */
export class SyncShipmentTrackingUpdates {
  constructor(
    private readonly shipmentTrackingRepository: ShipmentTrackingRepository,
    private readonly shipmentTrackingProvider: ShipmentTrackingProviderPort,
  ) {}

  async execute(): Promise<void> {
    const activeTrackings = await this.shipmentTrackingRepository.findActive();

    for (const tracking of activeTrackings) {
      try {
        const result = await this.shipmentTrackingProvider.query({
          trackingNumber: tracking.trackingNumber,
          carrierCode: tracking.carrierCode,
        });

        if (!result) {
          continue;
        }

        tracking.applySync(result.status, result.events, new Date());
        await this.shipmentTrackingRepository.save(tracking);
      } catch (error) {
        console.error(
          `[shipping] Error sincronizando el tracking ${tracking.trackingNumber}:`,
          error,
        );
      }
    }
  }
}

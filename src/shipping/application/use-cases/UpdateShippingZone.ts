import { ZoneShippingRateProps } from "../../domain/entities/ShippingZone";
import { ShippingZoneNotFoundException } from "../../domain/exceptions/ShippingZoneNotFoundException";
import { ShippingZoneRepository } from "../../domain/repositories/ShippingZoneRepository";

export interface UpdateShippingZoneInput {
  zoneId: string;
  name?: string;
  stateProvinces?: string[] | null;
  postalCodePatterns?: string[] | null;
  priority?: number;
  isActive?: boolean;
  /** Si viene, reemplaza la lista completa de tarifas de la zona. */
  rates?: ZoneShippingRateProps[];
}

/**
 * [0049]: edición de una zona. El país no se puede cambiar: mover una zona de
 * país cambiaría en silencio a quién se le cobra qué, y crear una zona nueva
 * deja rastro de la decisión.
 */
export class UpdateShippingZone {
  constructor(private readonly shippingZoneRepository: ShippingZoneRepository) {}

  async execute(input: UpdateShippingZoneInput): Promise<void> {
    const zone = await this.shippingZoneRepository.findById(input.zoneId);
    if (!zone) {
      throw new ShippingZoneNotFoundException();
    }

    zone.update({
      name: input.name,
      stateProvinces: input.stateProvinces,
      postalCodePatterns: input.postalCodePatterns,
      priority: input.priority,
      isActive: input.isActive,
    });

    if (input.rates) {
      zone.replaceRates(input.rates);
    }

    await this.shippingZoneRepository.save(zone);
  }
}

import { ZoneProductRestrictionProps } from "../../domain/entities/ShippingZone";
import { ShippingZoneNotFoundException } from "../../domain/exceptions/ShippingZoneNotFoundException";
import { ShippingZoneRepository } from "../../domain/repositories/ShippingZoneRepository";

export interface SetZoneProductRestrictionsInput {
  zoneId: string;
  restrictions: ZoneProductRestrictionProps[];
}

/**
 * [0049]: marca qué productos no se pueden enviar a una zona (ej. por
 * regulaciones de aduana).
 *
 * Recibe el set completo en vez de un alta/baja por producto: es lo que el
 * panel tiene en pantalla, y así quitar una restricción no necesita un
 * endpoint aparte.
 */
export class SetZoneProductRestrictions {
  constructor(private readonly shippingZoneRepository: ShippingZoneRepository) {}

  async execute(input: SetZoneProductRestrictionsInput): Promise<void> {
    const zone = await this.shippingZoneRepository.findById(input.zoneId);
    if (!zone) {
      throw new ShippingZoneNotFoundException();
    }

    zone.replaceRestrictions(input.restrictions);
    await this.shippingZoneRepository.save(zone);
  }
}

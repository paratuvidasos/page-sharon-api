import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { ShippingZone, ZoneShippingRateProps } from "../../domain/entities/ShippingZone";
import { ShippingZoneRepository } from "../../domain/repositories/ShippingZoneRepository";

export interface CreateShippingZoneInput {
  name: string;
  countryCode: string;
  stateProvinces: string[] | null;
  postalCodePatterns: string[] | null;
  priority: number;
  isActive: boolean;
  rates: ZoneShippingRateProps[];
}

/** [0049]: alta de una zona de cobertura desde el panel administrativo. */
export class CreateShippingZone {
  constructor(private readonly shippingZoneRepository: ShippingZoneRepository) {}

  async execute(input: CreateShippingZoneInput): Promise<{ id: string }> {
    const zone = ShippingZone.create({ id: generateId(), ...input });
    await this.shippingZoneRepository.save(zone);
    return { id: zone.id };
  }
}

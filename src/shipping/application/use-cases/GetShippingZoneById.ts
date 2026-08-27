import { ShippingZoneNotFoundException } from "../../domain/exceptions/ShippingZoneNotFoundException";
import {
  ShippingZoneQueryRepository,
  ShippingZoneReadModel,
} from "../../domain/repositories/ShippingZoneQueryRepository";

/** [0065]: detalle de una zona para precargar el formulario de edición del panel. */
export class GetShippingZoneById {
  constructor(private readonly shippingZoneQueryRepository: ShippingZoneQueryRepository) {}

  async execute(input: { zoneId: string }): Promise<ShippingZoneReadModel> {
    const zone = await this.shippingZoneQueryRepository.getById(input.zoneId);
    if (!zone) {
      throw new ShippingZoneNotFoundException();
    }
    return zone;
  }
}

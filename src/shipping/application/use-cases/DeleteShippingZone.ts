import { ShippingZoneNotFoundException } from "../../domain/exceptions/ShippingZoneNotFoundException";
import { ShippingZoneRepository } from "../../domain/repositories/ShippingZoneRepository";

/**
 * [0049]: baja de una zona. Se borra de verdad (con sus tarifas y
 * restricciones por cascada) y no se archiva: nada la referencia — el pedido
 * guarda un snapshot del método de envío, no una FK a la tarifa.
 */
export class DeleteShippingZone {
  constructor(private readonly shippingZoneRepository: ShippingZoneRepository) {}

  async execute(input: { zoneId: string }): Promise<void> {
    const zone = await this.shippingZoneRepository.findById(input.zoneId);
    if (!zone) {
      throw new ShippingZoneNotFoundException();
    }
    await this.shippingZoneRepository.delete(input.zoneId);
  }
}

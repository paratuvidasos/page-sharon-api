import {
  ShippingZonePage,
  ShippingZoneQueryRepository,
} from "../../domain/repositories/ShippingZoneQueryRepository";

/** [0049]: listado paginado de zonas para el panel de configuración. */
export class ListShippingZones {
  constructor(private readonly shippingZoneQueryRepository: ShippingZoneQueryRepository) {}

  async execute(input: { page: number; limit: number }): Promise<ShippingZonePage> {
    return this.shippingZoneQueryRepository.listZones({ page: input.page, limit: input.limit });
  }
}

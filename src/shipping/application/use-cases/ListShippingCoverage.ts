import {
  ShippingCoverageReadModel,
  ShippingZoneQueryRepository,
} from "../../domain/repositories/ShippingZoneQueryRepository";

/**
 * [0042]: países y regiones con cobertura activa.
 *
 * Le sirve a la calculadora de envío del carrito para no ofrecer destinos
 * que después van a responder "sin cobertura": es más honesto no listarlos
 * que dejar al comprador escribir una dirección completa para recibir un
 * error al final.
 */
export class ListShippingCoverage {
  constructor(private readonly shippingZoneQueryRepository: ShippingZoneQueryRepository) {}

  async execute(): Promise<{ countries: ShippingCoverageReadModel[] }> {
    return { countries: await this.shippingZoneQueryRepository.listCoverage() };
  }
}

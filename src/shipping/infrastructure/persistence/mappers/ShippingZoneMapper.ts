import { generateId } from "../../../../shared-kernel/infrastructure/ids/generate-id";
import { ShippingZone } from "../../../domain/entities/ShippingZone";
import { ShippingRateOrmEntity } from "../entities/ShippingRateOrmEntity";
import { ShippingZoneOrmEntity } from "../entities/ShippingZoneOrmEntity";
import { ShippingZoneProductRestrictionOrmEntity } from "../entities/ShippingZoneProductRestrictionOrmEntity";

/**
 * [0049]: convierte entre el agregado `ShippingZone` y las tres tablas que lo
 * respaldan.
 *
 * Las tarifas y las restricciones reciben un id nuevo en cada guardado porque
 * el dominio no las identifica por id (la tarifa se identifica por su método
 * dentro de la zona) y nada las referencia desde afuera: el pedido guarda un
 * snapshot del método de envío, deliberadamente sin FK a `shipping_rates`.
 */
export class ShippingZoneMapper {
  static toOrm(zone: ShippingZone): {
    zone: ShippingZoneOrmEntity;
    rates: ShippingRateOrmEntity[];
    restrictions: ShippingZoneProductRestrictionOrmEntity[];
  } {
    const props = zone.toProps();

    const zoneOrm = new ShippingZoneOrmEntity();
    zoneOrm.id = props.id;
    zoneOrm.name = props.name;
    zoneOrm.countryCode = props.countryCode;
    zoneOrm.stateProvinces = props.stateProvinces;
    zoneOrm.postalCodePatterns = props.postalCodePatterns;
    zoneOrm.priority = props.priority;
    zoneOrm.isActive = props.isActive;

    const rates = props.rates.map((rate) => {
      const rateOrm = new ShippingRateOrmEntity();
      rateOrm.id = generateId();
      rateOrm.zoneId = props.id;
      rateOrm.method = rate.method;
      rateOrm.label = rate.label;
      rateOrm.cost = rate.cost.toFixed(2);
      rateOrm.currency = rate.currency;
      rateOrm.estimatedMinDays = rate.estimatedMinDays;
      rateOrm.estimatedMaxDays = rate.estimatedMaxDays;
      rateOrm.freeShippingThreshold =
        rate.freeShippingThreshold == null ? null : rate.freeShippingThreshold.toFixed(2);
      rateOrm.isActive = rate.isActive;
      return rateOrm;
    });

    const restrictions = props.restrictedProducts.map((restriction) => {
      const restrictionOrm = new ShippingZoneProductRestrictionOrmEntity();
      restrictionOrm.id = generateId();
      restrictionOrm.zoneId = props.id;
      restrictionOrm.productId = restriction.productId;
      restrictionOrm.reason = restriction.reason;
      return restrictionOrm;
    });

    return { zone: zoneOrm, rates, restrictions };
  }

  static toDomain(
    zoneOrm: ShippingZoneOrmEntity,
    ratesOrm: ShippingRateOrmEntity[],
    restrictionsOrm: ShippingZoneProductRestrictionOrmEntity[],
  ): ShippingZone {
    return ShippingZone.reconstitute({
      id: zoneOrm.id,
      name: zoneOrm.name,
      countryCode: zoneOrm.countryCode,
      stateProvinces: zoneOrm.stateProvinces,
      postalCodePatterns: zoneOrm.postalCodePatterns,
      priority: zoneOrm.priority,
      isActive: zoneOrm.isActive,
      rates: ratesOrm.map((rate) => ({
        method: rate.method,
        label: rate.label,
        cost: Number(rate.cost),
        currency: rate.currency,
        estimatedMinDays: rate.estimatedMinDays,
        estimatedMaxDays: rate.estimatedMaxDays,
        freeShippingThreshold:
          rate.freeShippingThreshold == null ? null : Number(rate.freeShippingThreshold),
        isActive: rate.isActive,
      })),
      restrictedProducts: restrictionsOrm.map((restriction) => ({
        productId: restriction.productId,
        reason: restriction.reason,
      })),
    });
  }
}

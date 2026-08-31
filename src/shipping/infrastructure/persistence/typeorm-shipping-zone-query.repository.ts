import { DataSource, In, Repository } from "typeorm";
import {
  ShippingCoverageReadModel,
  ShippingZonePage,
  ShippingZoneQueryRepository,
  ShippingZoneReadModel,
} from "../../domain/repositories/ShippingZoneQueryRepository";
import { ShippingRateOrmEntity } from "./entities/ShippingRateOrmEntity";
import { ShippingZoneOrmEntity } from "./entities/ShippingZoneOrmEntity";
import { ShippingZoneProductRestrictionOrmEntity } from "./entities/ShippingZoneProductRestrictionOrmEntity";

export class TypeOrmShippingZoneQueryRepository implements ShippingZoneQueryRepository {
  private readonly zoneRepository: Repository<ShippingZoneOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.zoneRepository = dataSource.getRepository(ShippingZoneOrmEntity);
  }

  async listZones(pagination: { page: number; limit: number }): Promise<ShippingZonePage> {
    const [zones, total] = await this.zoneRepository.findAndCount({
      order: { priority: "DESC", name: "ASC" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    if (zones.length === 0) {
      return { items: [], total };
    }

    // Tarifas y restricciones en dos consultas con IN sobre los ids de la
    // página, no con un join sobre la query paginada: un join rompería el
    // conteo (paginaría filas del join, no zonas). Mismo patrón que el
    // historial de pedidos.
    const zoneIds = zones.map((zone) => zone.id);
    const [rates, restrictions] = await Promise.all([
      this.dataSource
        .getRepository(ShippingRateOrmEntity)
        .find({ where: { zoneId: In(zoneIds) }, order: { cost: "ASC" } }),
      this.dataSource
        .getRepository(ShippingZoneProductRestrictionOrmEntity)
        .find({ where: { zoneId: In(zoneIds) } }),
    ]);

    const ratesByZone = groupBy(rates, (rate) => rate.zoneId);
    const restrictionsByZone = groupBy(restrictions, (restriction) => restriction.zoneId);

    const items: ShippingZoneReadModel[] = zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      countryCode: zone.countryCode,
      stateProvinces: zone.stateProvinces,
      postalCodePatterns: zone.postalCodePatterns,
      priority: zone.priority,
      isActive: zone.isActive,
      rates: (ratesByZone.get(zone.id) ?? []).map((rate) => ({
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
      restrictedProducts: (restrictionsByZone.get(zone.id) ?? []).map((restriction) => ({
        productId: restriction.productId,
        reason: restriction.reason,
      })),
    }));

    return { items, total };
  }

  async getById(id: string): Promise<ShippingZoneReadModel | null> {
    const zone = await this.zoneRepository.findOne({ where: { id } });
    if (!zone) {
      return null;
    }

    const [rates, restrictions] = await Promise.all([
      this.dataSource.getRepository(ShippingRateOrmEntity).find({ where: { zoneId: id }, order: { cost: "ASC" } }),
      this.dataSource.getRepository(ShippingZoneProductRestrictionOrmEntity).find({ where: { zoneId: id } }),
    ]);

    return {
      id: zone.id,
      name: zone.name,
      countryCode: zone.countryCode,
      stateProvinces: zone.stateProvinces,
      postalCodePatterns: zone.postalCodePatterns,
      priority: zone.priority,
      isActive: zone.isActive,
      rates: rates.map((rate) => ({
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
      restrictedProducts: restrictions.map((restriction) => ({
        productId: restriction.productId,
        reason: restriction.reason,
      })),
    };
  }

  /**
   * Solo zonas activas con al menos una tarifa activa: una zona sin tarifas
   * cotizables no es cobertura real, y anunciarla haría que la calculadora
   * del carrito ofreciera un destino que después responde "sin cobertura".
   */
  async listCoverage(): Promise<ShippingCoverageReadModel[]> {
    const zones = await this.zoneRepository
      .createQueryBuilder("zone")
      .select(["zone.countryCode AS country_code", "zone.stateProvinces AS state_provinces"])
      .where("zone.is_active = true")
      .andWhere(
        `EXISTS (SELECT 1 FROM shipping_rates rate
                 WHERE rate.zone_id = zone.id AND rate.is_active = true)`,
      )
      .getRawMany<{ country_code: string; state_provinces: string[] | null }>();

    const byCountry = new Map<string, Set<string> | null>();
    for (const zone of zones) {
      const country = zone.country_code.trim().toUpperCase();
      const current = byCountry.get(country);

      // Una sola zona sin departamentos ya cubre el país entero: a partir de
      // ahí no tiene sentido acumular departamentos sueltos de otras zonas.
      if (current === null) {
        continue;
      }
      if (!zone.state_provinces) {
        byCountry.set(country, null);
        continue;
      }
      const merged = current ?? new Set<string>();
      for (const stateProvince of zone.state_provinces) {
        merged.add(stateProvince);
      }
      byCountry.set(country, merged);
    }

    return Array.from(byCountry.entries())
      .map(([countryCode, stateProvinces]) => ({
        countryCode,
        stateProvinces: stateProvinces ? Array.from(stateProvinces).sort() : null,
      }))
      .sort((a, b) => a.countryCode.localeCompare(b.countryCode));
  }
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }
  return grouped;
}

import { DataSource } from "typeorm";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../../domain/enums/ShippingMethod";
import {
  ShippingDestination,
  ShippingRateQueryRepository,
  ShippingRateReadModel,
} from "../../domain/repositories/ShippingRateQueryRepository";
import { ShippingRateOrmEntity } from "./entities/ShippingRateOrmEntity";

interface RawShippingRateRow {
  id: string;
  zone_id: string;
  zone_name: string;
  method: ShippingMethod;
  label: string;
  cost: string;
  currency: Currency;
  estimated_min_days: number;
  estimated_max_days: number;
  free_shipping_threshold: string | null;
}

export class TypeOrmShippingRateQueryRepository implements ShippingRateQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findRatesForDestination(destination: ShippingDestination): Promise<ShippingRateReadModel[]> {
    // Se resuelve la zona ganadora (mayor `priority`) en una subconsulta y se
    // traen sus tarifas en la misma query, con leftJoinAndSelect explícito
    // sobre la zona — nada de carga perezosa dentro de un loop (ver "Evitar
    // N+1" en el CLAUDE.md del repo).
    const rows = await this.dataSource
      .createQueryBuilder()
      .select([
        "rate.id AS id",
        "rate.zone_id AS zone_id",
        "zone.name AS zone_name",
        "rate.method AS method",
        "rate.label AS label",
        "rate.cost AS cost",
        "rate.currency AS currency",
        "rate.estimated_min_days AS estimated_min_days",
        "rate.estimated_max_days AS estimated_max_days",
        "rate.free_shipping_threshold AS free_shipping_threshold",
      ])
      .from(ShippingRateOrmEntity, "rate")
      .innerJoin("shipping_zones", "zone", "zone.id = rate.zone_id")
      .where("rate.is_active = true")
      .andWhere("zone.is_active = true")
      .andWhere("zone.country_code = :countryCode", { countryCode: destination.countryCode })
      // NULL en state_provinces = la zona cubre el país entero.
      .andWhere("(zone.state_provinces IS NULL OR :stateProvince = ANY(zone.state_provinces))", {
        stateProvince: destination.stateProvince,
      })
      .andWhere(
        `zone.priority = (
           SELECT MAX(z2.priority) FROM shipping_zones z2
           WHERE z2.is_active = true
             AND z2.country_code = :countryCode
             AND (z2.state_provinces IS NULL OR :stateProvince = ANY(z2.state_provinces))
         )`,
      )
      .orderBy("rate.cost", "ASC")
      .getRawMany<RawShippingRateRow>();

    return rows.map((row) => ({
      id: row.id,
      zoneId: row.zone_id,
      zoneName: row.zone_name,
      method: row.method,
      label: row.label,
      cost: Number(row.cost),
      currency: row.currency,
      estimatedMinDays: row.estimated_min_days,
      estimatedMaxDays: row.estimated_max_days,
      freeShippingThreshold:
        row.free_shipping_threshold == null ? null : Number(row.free_shipping_threshold),
    }));
  }
}

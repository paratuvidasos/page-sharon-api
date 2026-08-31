import { DataSource } from "typeorm";
import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { ShippingMethod } from "../../domain/enums/ShippingMethod";
import { RestrictedProductDetail } from "../../domain/exceptions/ProductsRestrictedForZoneException";
import {
  ShippingDestination,
  ShippingRateQueryRepository,
  ShippingRateReadModel,
} from "../../domain/repositories/ShippingRateQueryRepository";
import { ShippingRateOrmEntity } from "./entities/ShippingRateOrmEntity";
import { ShippingZoneProductRestrictionOrmEntity } from "./entities/ShippingZoneProductRestrictionOrmEntity";

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

/**
 * Predicado de cobertura de una zona contra un destino. Se genera para un
 * alias porque el mismo texto se usa dos veces: en el filtro de las tarifas y
 * en la subconsulta que elige la zona de mayor prioridad. Si las dos
 * versiones divergieran, `MAX(priority)` podría devolver la prioridad de una
 * zona que ni siquiera cubre el destino y la consulta no traería nada.
 *
 * Los criterios se acumulan: una zona con departamentos Y códigos postales
 * exige que el destino cumpla ambos. Un criterio en NULL no restringe. Si el
 * destino no trae departamento o código postal, la zona que sí lo exige no
 * matchea — no se puede afirmar cobertura sobre un dato que no se recibió.
 *
 * La comparación es en mayúsculas porque el dominio normaliza así al guardar
 * (`ShippingZone`), y lo que llega del comprador viene tal como lo escribió.
 */
function zoneCoveragePredicate(alias: string): string {
  return `${alias}.is_active = true
    AND ${alias}.country_code = :countryCode
    AND (${alias}.state_provinces IS NULL
         OR UPPER(CAST(:stateProvince AS text)) = ANY(${alias}.state_provinces))
    AND (${alias}.postal_code_patterns IS NULL
         OR EXISTS (
              SELECT 1 FROM unnest(${alias}.postal_code_patterns) AS pattern
              WHERE UPPER(CAST(:postalCode AS text)) LIKE pattern
            ))`;
}

function coverageParameters(destination: ShippingDestination): Record<string, unknown> {
  return {
    countryCode: destination.countryCode.toUpperCase(),
    stateProvince: destination.stateProvince ?? null,
    postalCode: destination.postalCode ?? null,
  };
}

export class TypeOrmShippingRateQueryRepository implements ShippingRateQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findRatesForDestination(destination: ShippingDestination): Promise<ShippingRateReadModel[]> {
    // Se resuelve la zona ganadora (mayor `priority`) en una subconsulta y se
    // traen sus tarifas en la misma query, con el join explícito sobre la
    // zona — nada de carga perezosa dentro de un loop (ver "Evitar N+1" en el
    // CLAUDE.md del repo).
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
      .andWhere(`(${zoneCoveragePredicate("zone")})`)
      .andWhere(
        `zone.priority = (
           SELECT MAX(z2.priority) FROM shipping_zones z2
           WHERE ${zoneCoveragePredicate("z2")}
         )`,
      )
      .setParameters(coverageParameters(destination))
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

  async findZoneIdForDestination(destination: ShippingDestination): Promise<string | null> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select("zone.id", "id")
      .from("shipping_zones", "zone")
      .where(zoneCoveragePredicate("zone"))
      .setParameters(coverageParameters(destination))
      .orderBy("zone.priority", "DESC")
      .limit(1)
      .getRawOne<{ id: string }>();

    return row?.id ?? null;
  }

  async findRestrictedProducts(
    zoneId: string,
    productIds: string[],
  ): Promise<RestrictedProductDetail[]> {
    if (productIds.length === 0) {
      return [];
    }

    const rows = await this.dataSource
      .createQueryBuilder()
      .select(["restriction.product_id AS product_id", "restriction.reason AS reason"])
      .from(ShippingZoneProductRestrictionOrmEntity, "restriction")
      .where("restriction.zone_id = :zoneId", { zoneId })
      .andWhere("restriction.product_id IN (:...productIds)", { productIds })
      .getRawMany<{ product_id: string; reason: string | null }>();

    return rows.map((row) => ({ productId: row.product_id, reason: row.reason }));
  }
}

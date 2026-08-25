import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/**
 * Zona de cobertura: un país entero, o un subconjunto de sus departamentos.
 * `state_provinces` en NULL significa "todo el país", que es el caso por
 * defecto mientras no haya transportadora con tarifas diferenciadas.
 */
@Entity({ name: "shipping_zones" })
export class ShippingZoneOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ name: "country_code", type: "char", length: 2 })
  @Index("ix_shipping_zones_country_code")
  countryCode!: string;

  @Column({ name: "state_provinces", type: "text", array: true, nullable: true })
  stateProvinces!: string[] | null;

  // Entre dos zonas que cubren el mismo destino gana la de mayor prioridad;
  // así una zona específica de departamento puede sobrescribir la del país
  // sin tener que desactivar esta última.
  @Column({ type: "integer", default: 0 })
  priority!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
}

import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/**
 * Zona de cobertura: un país entero, o un subconjunto de sus departamentos, o
 * un conjunto de códigos postales. `state_provinces` y `postal_code_patterns`
 * en NULL significan "sin restringir por ese criterio"; las dos en NULL es
 * "todo el país", que era el único caso posible antes de [0049].
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

  // [0049]: patrones LIKE de código postal, ya en mayúscula (ej. "110%").
  // Se guardan como patrón y no como rango porque los formatos de código
  // postal no son comparables entre países: "110%" en Colombia y "SW1%" en
  // Reino Unido se expresan igual, un rango numérico no.
  @Column({ name: "postal_code_patterns", type: "text", array: true, nullable: true })
  postalCodePatterns!: string[] | null;

  // Entre dos zonas que cubren el mismo destino gana la de mayor prioridad;
  // así una zona específica de departamento puede sobrescribir la del país
  // sin tener que desactivar esta última.
  @Column({ type: "integer", default: 0 })
  priority!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
}

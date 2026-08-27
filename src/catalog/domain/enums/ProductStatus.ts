export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  /**
   * [0057]: producto con pedidos históricos que el admin borró — no se puede
   * eliminar de verdad sin perder esa trazabilidad, así que se archiva.
   * Distinto de INACTIVE, que es "temporalmente fuera" por otros motivos.
   */
  ARCHIVED = "ARCHIVED",
}

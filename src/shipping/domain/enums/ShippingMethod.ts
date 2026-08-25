/**
 * [0034]: métodos de envío que el negocio ofrece. Son el vocabulario del
 * dominio, no un catálogo de transportadoras — cuál transportadora cubre
 * cada método es una decisión de infraestructura que todavía está pendiente
 * de definir (ver "Pendiente de definir" en el CLAUDE.md del repo).
 */
export enum ShippingMethod {
  STANDARD = "STANDARD",
  EXPRESS = "EXPRESS",
  PICKUP = "PICKUP",
}

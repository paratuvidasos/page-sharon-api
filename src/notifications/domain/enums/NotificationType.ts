/**
 * [0044]: qué clase de aviso es. Hoy solo hay uno; el enum existe igual para
 * que el buzón pueda filtrar y agrupar sin tener que adivinar por el texto del
 * mensaje cuando aparezca el segundo tipo.
 */
export enum NotificationType {
  ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED",
  /** [0064]: el admin rechazó una reseña del usuario, con motivo. */
  REVIEW_REJECTED = "REVIEW_REJECTED",
}

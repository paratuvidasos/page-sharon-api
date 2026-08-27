/**
 * [0064]: estado de moderación de una reseña. `APPROVED` es el default de
 * creación cuando el flag `REVIEWS_REQUIRE_MODERATION` está apagado (el
 * comportamiento actual, preservado) — con el flag encendido, una reseña
 * nueva nace `PENDING`.
 */
export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  /** Una reseña ya publicada que el admin decidió ocultar después. */
  HIDDEN = "HIDDEN",
}

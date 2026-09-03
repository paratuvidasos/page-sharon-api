export enum BannerCategory {
  /** Banner que promociona un evento (con entrada paga o inscripción gratuita). */
  EVENTO = "EVENTO",
  /** Banner que promociona un kit/combo de productos. */
  KIT = "KIT",
  /** Banner de descuento o promoción puntual. */
  PROMOCION = "PROMOCION",
  /** Banner de lanzamiento de un producto o línea nueva. */
  LANZAMIENTO = "LANZAMIENTO",
  /** Banner de una colección o edición de temporada. */
  COLECCION = "COLECCION",
  /** Catch-all para banners institucionales/de marca que no encajan en las categorías anteriores. */
  GENERAL = "GENERAL",
}

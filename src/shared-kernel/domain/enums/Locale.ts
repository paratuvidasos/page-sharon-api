/**
 * [0067]/[0068]/[0069]/[0070]: idiomas en los que la tienda puede mostrarse.
 *
 * Vive en `shared-kernel` porque lo consumen `catalog` (traducciones de
 * producto), `accounts` (preferencia guardada) y el módulo `localization`
 * por igual — misma razón que `Currency` (ver ese archivo).
 */
export enum Locale {
  ES = "es",
  EN = "en",
}

/** Idioma en el que está escrito el contenido base del catálogo (español). */
export const DEFAULT_LOCALE = Locale.ES;

/**
 * [0041]: monedas en las que se puede cotizar y cobrar. Se limita a las dos
 * que Bold procesa nativamente en el Botón de Pagos (`data-currency`) — no
 * tiene sentido ofrecer una moneda que la pasarela va a rechazar.
 *
 * Vive en `shared-kernel` porque la usan `orders`, `payments` y `shipping`
 * por igual (ver sección "Enums" del CLAUDE.md del repo: una sola fuente de
 * verdad que se propaga a la DB, al dominio y a Swagger).
 */
export enum Currency {
  COP = "COP",
  USD = "USD",
}

/** Moneda base del negocio: en la que están expresados los precios del catálogo. */
export const BASE_CURRENCY = Currency.COP;

/**
 * [0049]: `orders` le pregunta a `shipping` si todos los productos del pedido
 * se pueden enviar al destino. Lo implementa `shipping` con
 * `CheckShippingRestrictions`.
 *
 * No devuelve nada: si algún producto está restringido, la implementación
 * lanza su propia excepción de dominio (422), que el manejador de errores de
 * Express ya sabe traducir. `orders` no necesita conocerla ni importarla —
 * misma forma que `ShippingQuotePort` (regla 2 del CLAUDE.md del repo).
 */
export interface ShippingRestrictionPort {
  execute(input: {
    countryCode: string;
    stateProvince: string | null;
    postalCode: string | null;
    productIds: string[];
  }): Promise<void>;
}

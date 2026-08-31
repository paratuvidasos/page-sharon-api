/**
 * [0041]: convierte un monto de la moneda base a la moneda de cobro.
 *
 * Redondea a entero porque la pasarela exige `data-amount` sin decimales.
 * Para COP eso es exacto (el peso no usa centavos); para USD implica cobrar
 * en dólares enteros, que es la consecuencia directa de esa restricción de
 * Bold y no una decisión de diseño nuestra. Si en el futuro se acepta una
 * moneda con centavos de verdad, este es el único lugar que hay que revisar.
 */
export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate);
}

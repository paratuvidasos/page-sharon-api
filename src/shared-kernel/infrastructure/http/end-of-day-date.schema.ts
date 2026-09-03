import { z } from "zod";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Para campos "hasta"/"endsAt": si el frontend manda una fecha sin hora
 * (`"2026-09-03"`, típico de un `<input type="date">`), `z.coerce.date()` la
 * interpreta como medianoche UTC de ese día — el registro queda "vencido"
 * casi todo el día que el usuario esperaba que siguiera vigente. Acá se
 * normaliza una fecha-sin-hora al final de ese día (23:59:59.999 UTC); un
 * datetime completo que ya venga con hora se deja intacto.
 */
export const EndOfDayDateSchema = z.preprocess((value) => {
  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    return `${value}T23:59:59.999Z`;
  }
  return value;
}, z.coerce.date());

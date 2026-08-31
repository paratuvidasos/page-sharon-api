import { ParcelMeasurements } from "../domain/ports/CarrierRateProviderPort";
import { VariantParcelSnapshot } from "./ports/ProductParcelPort";

export interface ShipmentItem {
  variantId: string;
  quantity: number;
}

/**
 * [0048]: arma el bulto que se le manda a la transportadora.
 *
 * El peso se suma (es lo que efectivamente va a viajar). Las dimensiones se
 * toman como el máximo de cada eje entre los artículos, que es una
 * aproximación deliberada: cómo se acomodan varios artículos en una caja lo
 * decide quien empaca, no este código, y el máximo por eje describe al menos
 * una caja capaz de contener el artículo más grande. Quedarse corto sería
 * peor: la diferencia la termina pagando el negocio.
 *
 * Devuelve `null` si ninguna variante tiene peso cargado. Sin peso, la
 * transportadora cotizaría sobre un dato inventado, así que es mejor no
 * consultarla y usar la tarifa de respaldo.
 */
export function buildParcel(
  items: ShipmentItem[],
  snapshots: VariantParcelSnapshot[],
): ParcelMeasurements | null {
  const byVariantId = new Map(snapshots.map((snapshot) => [snapshot.variantId, snapshot]));

  let weightGrams = 0;
  let lengthCm: number | null = null;
  let widthCm: number | null = null;
  let heightCm: number | null = null;

  for (const item of items) {
    const snapshot = byVariantId.get(item.variantId);
    if (!snapshot) {
      continue;
    }
    weightGrams += snapshot.weightGrams * item.quantity;
    lengthCm = maxOrNull(lengthCm, snapshot.lengthCm);
    widthCm = maxOrNull(widthCm, snapshot.widthCm);
    heightCm = maxOrNull(heightCm, snapshot.heightCm);
  }

  return weightGrams > 0 ? { weightGrams, lengthCm, widthCm, heightCm } : null;
}

function maxOrNull(current: number | null, candidate: number | null): number | null {
  if (candidate == null) {
    return current;
  }
  return current == null ? candidate : Math.max(current, candidate);
}

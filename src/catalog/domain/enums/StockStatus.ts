export enum StockStatus {
  IN_STOCK = "IN_STOCK",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}

export const LOW_STOCK_THRESHOLD = 5;

/**
 * [0059]: `threshold` es opcional — cuando una variante no tiene su propio
 * umbral configurado (`lowStockThreshold: null`), se usa `LOW_STOCK_THRESHOLD`
 * como default. Firma retrocompatible: los call sites que ya llamaban con un
 * solo argumento (listados que no cargan el umbral por variante) siguen
 * funcionando igual.
 */
export function computeStockStatus(quantity: number, threshold: number = LOW_STOCK_THRESHOLD): StockStatus {
  if (quantity <= 0) {
    return StockStatus.OUT_OF_STOCK;
  }
  if (quantity <= threshold) {
    return StockStatus.LOW_STOCK;
  }
  return StockStatus.IN_STOCK;
}

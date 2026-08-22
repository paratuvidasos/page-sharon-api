export enum StockStatus {
  IN_STOCK = "IN_STOCK",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}

export const LOW_STOCK_THRESHOLD = 5;

export function computeStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) {
    return StockStatus.OUT_OF_STOCK;
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return StockStatus.LOW_STOCK;
  }
  return StockStatus.IN_STOCK;
}

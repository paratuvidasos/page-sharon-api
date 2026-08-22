export interface ProductRatingSummary {
  average: number | null;
  count: number;
}

/**
 * Puerto que `catalog` define para lo que necesita de `aftersales`
 * (calificación promedio + conteo de reseñas por producto), sin importar su
 * infraestructura (ver regla 2 del CLAUDE.md del repo). Hasta que exista
 * [0021], ningún módulo implementa este puerto y los casos de uso de
 * catalog lo tratan como opcional.
 */
export interface RatingSummaryPort {
  execute(input: { productIds: string[] }): Promise<Map<string, ProductRatingSummary>>;
}

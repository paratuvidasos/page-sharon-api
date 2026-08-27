/**
 * [0057]: puerto que `catalog` define para lo que necesita de `orders`
 * (si un producto tiene pedidos históricos reales) sin importar su
 * infraestructura (ver regla 2 del CLAUDE.md del repo). Lo implementa
 * `HasProductBeenOrdered`, expuesto por `orders`.
 */
export interface ProductOrderHistoryPort {
  execute(input: { productId: string }): Promise<boolean>;
}

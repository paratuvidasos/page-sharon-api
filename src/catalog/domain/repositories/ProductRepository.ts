import { Product } from "../entities/Product";

/**
 * Puerto de escritura del agregado `Product` (incluye sus variantes). Se
 * mantiene separado del read model de `ProductQueryRepository` porque no es
 * una consulta (ver sección "Repository pattern" del CLAUDE.md del repo).
 */
export interface ProductSaleItem {
  productId: string;
  quantity: number;
}

export interface ProductRepository {
  save(product: Product): Promise<void>;

  findById(id: string): Promise<Product | null>;

  findBySlug(slug: string): Promise<Product | null>;

  /**
   * [0019]: incrementa `salesCount` por producto con un UPDATE atómico, sin
   * pasar por el agregado completo — es un contador derivado, no una regla
   * de negocio que el dominio de `Product` necesite conocer.
   */
  incrementSalesCounts(items: ProductSaleItem[]): Promise<void>;

  /**
   * [0022]: marca/desmarca un producto como destacado desde el panel
   * administrativo. Lanza `ProductNotFoundException` si el id no existe.
   */
  setFeatured(productId: string, isFeatured: boolean): Promise<void>;

  /**
   * [0057]: borrado real (cascada a variantes por FK). `DeleteProduct` solo
   * lo llama cuando el producto no tiene pedidos históricos — si los tiene,
   * archiva en vez de borrar.
   */
  delete(id: string): Promise<void>;

  /**
   * [0057]: si ya existe una variante (de cualquier producto) con ese SKU.
   * `excludeVariantId` se usa al editar una variante para no chocar contra
   * su propio SKU.
   */
  existsVariantWithSku(sku: string, excludeVariantId?: string): Promise<boolean>;

  /**
   * [0059]: corrección manual de stock desde el panel administrativo — un
   * UPDATE atómico, no un `save()` del agregado completo, porque compite con
   * los holds de checkout concurrentes (mismo criterio que `setFeatured`).
   * Lanza `VariantNotFoundException` si la variante no existe.
   */
  setVariantStock(variantId: string, quantity: number): Promise<void>;

  setVariantLowStockThreshold(variantId: string, threshold: number | null): Promise<void>;
}

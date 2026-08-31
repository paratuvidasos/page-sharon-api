import { ReviewSort } from "../enums/ReviewSort";
import { ReviewStatus } from "../enums/ReviewStatus";

export interface ReviewListItem {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ModerationReviewItem {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  rejectionReason: string | null;
  createdAt: Date;
}

export interface ModerationListFilter {
  status?: ReviewStatus;
}

export interface ModerationListPage {
  items: ModerationReviewItem[];
  total: number;
}

export interface ReviewListPagination {
  page: number;
  limit: number;
}

export interface ReviewListPage {
  items: ReviewListItem[];
  total: number;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}

/**
 * Read model de solo lectura para reseñas — devuelve DTOs planos en vez del
 * agregado `Review` completo (ver sección "Queries" del CLAUDE.md del
 * repo).
 */
export interface ReviewQueryRepository {
  /**
   * [0064]: solo reseñas `APPROVED` — con moderación activada, una reseña
   * `PENDING`/`REJECTED`/`HIDDEN` no debe llegar al catálogo público.
   */
  listForProduct(
    productId: string,
    sort: ReviewSort,
    pagination: ReviewListPagination,
  ): Promise<ReviewListPage>;

  /** [0064]: cola de moderación del panel administrativo. */
  listForModeration(filter: ModerationListFilter, pagination: ReviewListPagination): Promise<ModerationListPage>;

  getRatingSummaryForProduct(productId: string): Promise<RatingSummary>;

  /**
   * Versión en lote de `getRatingSummaryForProduct`, para el puerto que
   * consume `catalog` en sus listados (ver `RatingSummaryPort` de catalog).
   * Deliberadamente acotada a un conjunto de ids, nunca "todas las
   * calificaciones" (ver regla de paginación del CLAUDE.md del repo).
   */
  getRatingSummaryForProducts(productIds: string[]): Promise<Map<string, RatingSummary>>;
}

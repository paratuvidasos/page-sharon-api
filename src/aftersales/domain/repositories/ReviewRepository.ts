import { Review } from "../entities/Review";

/**
 * Puerto de escritura del agregado `Review`. Se mantiene separado del read
 * model de `ReviewQueryRepository` porque no es una consulta (ver sección
 * "Repository pattern" del CLAUDE.md del repo).
 */
export interface ReviewRepository {
  save(review: Review): Promise<void>;

  /** Evita reseñas duplicadas del mismo usuario sobre el mismo producto. */
  existsForProductAndUser(productId: string, userId: string): Promise<boolean>;
}

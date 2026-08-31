import { ReviewRejected } from "../../../shared-kernel/domain/events/ReviewRejected";
import { DomainEventPublisher } from "../../../shared-kernel/domain/ports/DomainEventPublisher";
import { ReviewNotFoundException } from "../../domain/exceptions/ReviewNotFoundException";
import { ReviewRepository } from "../../domain/repositories/ReviewRepository";

/** Puerto expuesto por `accounts` — ver `GetCustomerContact`. */
export interface CustomerContactPort {
  execute(input: { userId: string }): Promise<{ email: string; fullName: string }>;
}

/**
 * [0064]: rechaza una reseña pendiente de moderación, con motivo. Publica
 * `ReviewRejected` para que `notifications` avise al cliente — `aftersales`
 * nunca envía el correo directamente (regla 3 del CLAUDE.md del repo).
 */
export class RejectReview {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly customerContactPort: CustomerContactPort,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: { reviewId: string; reason: string }): Promise<void> {
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) {
      throw new ReviewNotFoundException();
    }

    review.reject(input.reason);
    await this.reviewRepository.save(review);

    // Si el usuario ya no existe (cuenta eliminada), no hay a quién avisar —
    // el rechazo igual queda aplicado, solo no se publica el evento.
    try {
      const contact = await this.customerContactPort.execute({ userId: review.userId });
      await this.domainEventPublisher.publish(
        new ReviewRejected(review.id, review.productId, review.userId, contact.email, input.reason),
      );
    } catch (error) {
      console.error(`[aftersales] No se pudo notificar el rechazo de la reseña ${review.id}:`, error);
    }
  }
}

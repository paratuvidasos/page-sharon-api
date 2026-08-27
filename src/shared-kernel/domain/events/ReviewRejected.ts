import { DomainEvent } from "./DomainEvent";

/**
 * [0064]: publicado por `aftersales` cuando el admin rechaza una reseña.
 *
 * Lleva el destinatario y el motivo **dentro del evento**, igual que
 * `OrderStatusChanged`: así `notifications` arma el correo sin consultar a
 * `aftersales` ni a `accounts` (regla 3 del CLAUDE.md del repo).
 */
export class ReviewRejected implements DomainEvent {
  static readonly eventName = "aftersales.review_rejected";
  readonly eventName = ReviewRejected.eventName;
  readonly occurredAt: Date;

  constructor(
    public readonly reviewId: string,
    public readonly productId: string,
    public readonly userId: string,
    public readonly recipientEmail: string,
    public readonly reason: string,
  ) {
    this.occurredAt = new Date();
  }
}

import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Review } from "../../domain/entities/Review";
import { DuplicateReviewException } from "../../domain/exceptions/DuplicateReviewException";
import { ReviewRequiresVerifiedPurchaseException } from "../../domain/exceptions/ReviewRequiresVerifiedPurchaseException";
import { ReviewRepository } from "../../domain/repositories/ReviewRepository";

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface CreateReviewResult {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface HasUserPurchasedProductPort {
  execute(input: { userId: string; productId: string }): Promise<boolean>;
}

/**
 * Reseñas: una por persona y producto.
 *
 * Exigir compra verificada es opcional y viene **apagado** por defecto. El
 * negocio ya lleva años operando y buena parte de su clientela compró antes
 * de que existiera este sistema: exigirlo dejaría fuera justo a quienes más
 * tienen que contar, porque sus compras no están en esta base de datos.
 *
 * Se conserva como interruptor y no se borró el puerto porque la intención es
 * activarlo más adelante, cuando el histórico de pedidos propios ya sea
 * representativo.
 *
 * Consecuencia a tener presente: el diseño original de [0013]-[0022] no
 * incluyó estado de moderación precisamente porque toda reseña era, por
 * construcción, de compra verificada. Con el interruptor apagado eso deja de
 * ser cierto, y hoy nada distingue una reseña verificada de una que no lo es.
 */
export class CreateReview {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly hasUserPurchasedProduct: HasUserPurchasedProductPort,
    private readonly requireVerifiedPurchase: boolean,
  ) {}

  async execute(input: CreateReviewInput): Promise<CreateReviewResult> {
    const alreadyReviewed = await this.reviewRepository.existsForProductAndUser(
      input.productId,
      input.userId,
    );
    if (alreadyReviewed) {
      throw new DuplicateReviewException();
    }

    // Con el interruptor apagado ni siquiera se consulta: sería una query
    // contra los pedidos cuyo resultado se iba a ignorar.
    if (this.requireVerifiedPurchase) {
      const purchased = await this.hasUserPurchasedProduct.execute({
        userId: input.userId,
        productId: input.productId,
      });
      if (!purchased) {
        throw new ReviewRequiresVerifiedPurchaseException();
      }
    }

    const review = Review.create({
      id: generateId(),
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
    });
    await this.reviewRepository.save(review);

    const props = review.toProps();
    return { id: props.id, rating: props.rating, comment: props.comment, createdAt: props.createdAt };
  }
}

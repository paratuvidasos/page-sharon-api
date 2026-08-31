import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Review } from "../../domain/entities/Review";
import { ReviewStatus } from "../../domain/enums/ReviewStatus";
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
  status: ReviewStatus;
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
 *
 * [0064]: `requireModeration` es otro interruptor independiente, también
 * apagado por defecto (se preserva el comportamiento actual de publicación
 * inmediata). Encendido, una reseña nace `PENDING` y necesita que un admin
 * la apruebe antes de aparecer en el catálogo público.
 */
export class CreateReview {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly hasUserPurchasedProduct: HasUserPurchasedProductPort,
    private readonly requireVerifiedPurchase: boolean,
    private readonly requireModeration: boolean,
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
      initialStatus: this.requireModeration ? ReviewStatus.PENDING : ReviewStatus.APPROVED,
    });
    await this.reviewRepository.save(review);

    const props = review.toProps();
    return {
      id: props.id,
      rating: props.rating,
      comment: props.comment,
      status: props.status,
      createdAt: props.createdAt,
    };
  }
}

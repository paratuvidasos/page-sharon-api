import { Router } from "express";
import { DataSource } from "typeorm";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { ApproveReview } from "../../application/use-cases/ApproveReview";
import { CreateReview, HasUserPurchasedProductPort } from "../../application/use-cases/CreateReview";
import { GetProductReviews } from "../../application/use-cases/GetProductReviews";
import { GetRatingSummaryForProducts } from "../../application/use-cases/GetRatingSummaryForProducts";
import { HideReview } from "../../application/use-cases/HideReview";
import { ListReviewsForModeration } from "../../application/use-cases/ListReviewsForModeration";
import { CustomerContactPort, RejectReview } from "../../application/use-cases/RejectReview";
import { TypeOrmReviewQueryRepository } from "../persistence/typeorm-review-query.repository";
import { TypeOrmReviewRepository } from "../persistence/typeorm-review.repository";
import { ReviewsController } from "./reviews.controller";
import { buildReviewsRoutes } from "./reviews.routes";

export interface AftersalesModule {
  reviewsRouter: Router;
  getRatingSummaryForProducts: GetRatingSummaryForProducts;
  /** [0064]: moderación de reseñas para el panel administrativo. */
  listReviewsForModeration: ListReviewsForModeration;
  approveReview: ApproveReview;
  rejectReview: RejectReview;
  hideReview: HideReview;
}

export function buildAftersalesModule(
  dataSource: DataSource,
  hasUserPurchasedProduct: HasUserPurchasedProductPort,
  customerContactPort: CustomerContactPort,
): AftersalesModule {
  const reviewRepository = new TypeOrmReviewRepository(dataSource);
  const reviewQueryRepository = new TypeOrmReviewQueryRepository(dataSource);

  const createReview = new CreateReview(
    reviewRepository,
    hasUserPurchasedProduct,
    readRequireVerifiedPurchase(),
    readRequireModeration(),
  );
  const getProductReviews = new GetProductReviews(reviewQueryRepository);
  const getRatingSummaryForProducts = new GetRatingSummaryForProducts(reviewQueryRepository);
  const controller = new ReviewsController(createReview, getProductReviews);

  const listReviewsForModeration = new ListReviewsForModeration(reviewQueryRepository);
  const approveReview = new ApproveReview(reviewRepository);
  const rejectReview = new RejectReview(reviewRepository, customerContactPort, domainEventBus);
  const hideReview = new HideReview(reviewRepository);

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);

  return {
    reviewsRouter: buildReviewsRoutes(controller, authenticate),
    getRatingSummaryForProducts,
    listReviewsForModeration,
    approveReview,
    rejectReview,
    hideReview,
  };
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado.");
  }
  return secret;
}

/**
 * Apagado por defecto: hoy cualquiera con cuenta puede reseñar. Ver el porqué
 * en `CreateReview`. Activarlo es poner
 * `REVIEWS_REQUIRE_VERIFIED_PURCHASE=true` en el entorno.
 */
function readRequireVerifiedPurchase(): boolean {
  return process.env.REVIEWS_REQUIRE_VERIFIED_PURCHASE === "true";
}

/**
 * [0064]: apagado por defecto — preserva el comportamiento actual de
 * publicación inmediata. Activarlo es poner
 * `REVIEWS_REQUIRE_MODERATION=true` en el entorno.
 */
function readRequireModeration(): boolean {
  return process.env.REVIEWS_REQUIRE_MODERATION === "true";
}

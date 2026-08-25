import { Router } from "express";
import { DataSource } from "typeorm";
import { buildAuthenticate } from "../../../shared-kernel/infrastructure/http/authenticate.middleware";
import { JwtTokenService } from "../../../shared-kernel/infrastructure/security/JwtTokenService";
import { CreateReview, HasUserPurchasedProductPort } from "../../application/use-cases/CreateReview";
import { GetProductReviews } from "../../application/use-cases/GetProductReviews";
import { GetRatingSummaryForProducts } from "../../application/use-cases/GetRatingSummaryForProducts";
import { TypeOrmReviewQueryRepository } from "../persistence/typeorm-review-query.repository";
import { TypeOrmReviewRepository } from "../persistence/typeorm-review.repository";
import { ReviewsController } from "./reviews.controller";
import { buildReviewsRoutes } from "./reviews.routes";

export interface AftersalesModule {
  reviewsRouter: Router;
  getRatingSummaryForProducts: GetRatingSummaryForProducts;
}

export function buildAftersalesModule(
  dataSource: DataSource,
  hasUserPurchasedProduct: HasUserPurchasedProductPort,
): AftersalesModule {
  const reviewRepository = new TypeOrmReviewRepository(dataSource);
  const reviewQueryRepository = new TypeOrmReviewQueryRepository(dataSource);

  const createReview = new CreateReview(
    reviewRepository,
    hasUserPurchasedProduct,
    readRequireVerifiedPurchase(),
  );
  const getProductReviews = new GetProductReviews(reviewQueryRepository);
  const getRatingSummaryForProducts = new GetRatingSummaryForProducts(reviewQueryRepository);
  const controller = new ReviewsController(createReview, getProductReviews);

  const tokenService = new JwtTokenService(requireJwtSecret());
  const authenticate = buildAuthenticate(tokenService);

  return {
    reviewsRouter: buildReviewsRoutes(controller, authenticate),
    getRatingSummaryForProducts,
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

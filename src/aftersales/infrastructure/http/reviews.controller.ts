import { Request, Response } from "express";
import { UnauthorizedException } from "../../../shared-kernel/domain/exceptions/UnauthorizedException";
import { CreateReview } from "../../application/use-cases/CreateReview";
import { GetProductReviews } from "../../application/use-cases/GetProductReviews";
import { CreateReviewRequestSchema, ReviewProductIdParamsSchema } from "./schemas/create-review.schema";
import { ListReviewsQuerySchema } from "./schemas/list-reviews.schema";

export class ReviewsController {
  constructor(
    private readonly createReview: CreateReview,
    private readonly getProductReviews: GetProductReviews,
  ) {}

  private requireUserId(req: Request): string {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }
    return req.authUser.sub;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { productId } = ReviewProductIdParamsSchema.parse(req.params);
    const body = CreateReviewRequestSchema.parse(req.body);
    const result = await this.createReview.execute({
      productId,
      userId,
      rating: body.rating,
      comment: body.comment,
    });
    res.status(201).json(result);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { productId } = ReviewProductIdParamsSchema.parse(req.params);
    const query = ListReviewsQuerySchema.parse(req.query);
    const result = await this.getProductReviews.execute({
      productId,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });

    res.status(200).json({
      items: result.items.map((item) => ({ ...item, verifiedPurchase: true as const })),
      meta: result.meta,
      ratingSummary: result.ratingSummary,
    });
  };
}

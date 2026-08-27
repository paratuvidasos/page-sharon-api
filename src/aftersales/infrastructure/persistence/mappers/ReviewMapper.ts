import { Review } from "../../../domain/entities/Review";
import { ReviewOrmEntity } from "../entities/ReviewOrmEntity";

export class ReviewMapper {
  static toOrm(review: Review): ReviewOrmEntity {
    const props = review.toProps();

    const orm = new ReviewOrmEntity();
    orm.id = props.id;
    orm.productId = props.productId;
    orm.userId = props.userId;
    orm.rating = props.rating;
    orm.comment = props.comment;
    orm.status = props.status;
    orm.rejectionReason = props.rejectionReason;
    orm.createdAt = props.createdAt;
    return orm;
  }

  static toDomain(orm: ReviewOrmEntity): Review {
    return Review.reconstitute({
      id: orm.id,
      productId: orm.productId,
      userId: orm.userId,
      rating: orm.rating,
      comment: orm.comment,
      status: orm.status,
      rejectionReason: orm.rejectionReason,
      createdAt: orm.createdAt,
    });
  }
}

import { DataSource, Repository } from "typeorm";
import { ReviewSort } from "../../domain/enums/ReviewSort";
import { ReviewStatus } from "../../domain/enums/ReviewStatus";
import {
  ModerationListFilter,
  ModerationListPage,
  RatingSummary,
  ReviewListPage,
  ReviewListPagination,
  ReviewQueryRepository,
} from "../../domain/repositories/ReviewQueryRepository";
import { ReviewOrmEntity } from "./entities/ReviewOrmEntity";

export class TypeOrmReviewQueryRepository implements ReviewQueryRepository {
  private readonly ormRepository: Repository<ReviewOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(ReviewOrmEntity);
  }

  async listForProduct(
    productId: string,
    sort: ReviewSort,
    pagination: ReviewListPagination,
  ): Promise<ReviewListPage> {
    // [0064]: solo APPROVED — con moderación activada, una reseña pendiente,
    // rechazada u oculta no debe llegar al catálogo público.
    const qb = this.ormRepository
      .createQueryBuilder("review")
      .where("review.productId = :productId", { productId })
      .andWhere("review.status = :status", { status: ReviewStatus.APPROVED });

    if (sort === ReviewSort.HIGHEST_RATED) {
      qb.orderBy("review.rating", "DESC");
    } else {
      qb.orderBy("review.createdAt", "DESC");
    }
    qb.addOrderBy("review.createdAt", "DESC");

    const [rows, total] = await qb
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      items: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  async listForModeration(
    filter: ModerationListFilter,
    pagination: ReviewListPagination,
  ): Promise<ModerationListPage> {
    const qb = this.ormRepository.createQueryBuilder("review");

    if (filter.status) {
      qb.andWhere("review.status = :status", { status: filter.status });
    }

    qb.orderBy("review.createdAt", "ASC");

    const [rows, total] = await qb
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      items: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        userId: row.userId,
        rating: row.rating,
        comment: row.comment,
        status: row.status,
        rejectionReason: row.rejectionReason,
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  async getRatingSummaryForProduct(productId: string): Promise<RatingSummary> {
    const summary = await this.getRatingSummaryForProducts([productId]);
    return summary.get(productId) ?? { average: null, count: 0 };
  }

  async getRatingSummaryForProducts(productIds: string[]): Promise<Map<string, RatingSummary>> {
    const rows = await this.ormRepository
      .createQueryBuilder("review")
      .select("review.productId", "productId")
      .addSelect("AVG(review.rating)", "average")
      .addSelect("COUNT(*)", "count")
      .where("review.productId IN (:...productIds)", { productIds })
      .andWhere("review.status = :status", { status: ReviewStatus.APPROVED })
      .groupBy("review.productId")
      .getRawMany<{ productId: string; average: string; count: string }>();

    return new Map(
      rows.map((row) => [
        row.productId,
        { average: Math.round(Number(row.average) * 10) / 10, count: Number(row.count) },
      ]),
    );
  }
}

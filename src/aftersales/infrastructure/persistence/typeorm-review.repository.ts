import { DataSource, Repository } from "typeorm";
import { Review } from "../../domain/entities/Review";
import { ReviewRepository } from "../../domain/repositories/ReviewRepository";
import { ReviewOrmEntity } from "./entities/ReviewOrmEntity";
import { ReviewMapper } from "./mappers/ReviewMapper";

export class TypeOrmReviewRepository implements ReviewRepository {
  private readonly ormRepository: Repository<ReviewOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(ReviewOrmEntity);
  }

  async save(review: Review): Promise<void> {
    const orm = ReviewMapper.toOrm(review);
    await this.ormRepository.save(orm);
  }

  async existsForProductAndUser(productId: string, userId: string): Promise<boolean> {
    const count = await this.ormRepository.countBy({ productId, userId });
    return count > 0;
  }

  async findById(id: string): Promise<Review | null> {
    const orm = await this.ormRepository.findOne({ where: { id } });
    return orm ? ReviewMapper.toDomain(orm) : null;
  }
}

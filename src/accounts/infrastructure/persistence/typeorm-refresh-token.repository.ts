import { DataSource, Repository } from "typeorm";
import { RefreshToken } from "../../domain/entities/RefreshToken";
import { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import { RefreshTokenOrmEntity } from "./entities/RefreshTokenOrmEntity";
import { RefreshTokenMapper } from "./mappers/RefreshTokenMapper";

export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  private readonly ormRepository: Repository<RefreshTokenOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(RefreshTokenOrmEntity);
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.ormRepository.save(RefreshTokenMapper.toOrm(refreshToken));
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const orm = await this.ormRepository.findOne({ where: { tokenHash } });
    return orm ? RefreshTokenMapper.toDomain(orm) : null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update()
      .set({ revokedAt: () => "now()" })
      .where("user_id = :userId", { userId })
      .andWhere("revoked_at IS NULL")
      .execute();
  }
}

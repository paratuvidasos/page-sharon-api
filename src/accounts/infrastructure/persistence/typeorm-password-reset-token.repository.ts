import { DataSource, Repository } from "typeorm";
import { PasswordResetToken } from "../../domain/entities/PasswordResetToken";
import { PasswordResetTokenRepository } from "../../domain/repositories/PasswordResetTokenRepository";
import { PasswordResetTokenOrmEntity } from "./entities/PasswordResetTokenOrmEntity";
import { PasswordResetTokenMapper } from "./mappers/PasswordResetTokenMapper";

export class TypeOrmPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private readonly ormRepository: Repository<PasswordResetTokenOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(PasswordResetTokenOrmEntity);
  }

  async save(token: PasswordResetToken): Promise<void> {
    await this.ormRepository.save(PasswordResetTokenMapper.toOrm(token));
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const orm = await this.ormRepository.findOne({ where: { tokenHash } });
    return orm ? PasswordResetTokenMapper.toDomain(orm) : null;
  }

  async invalidateActiveByUserId(userId: string): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update()
      .set({ usedAt: () => "now()" })
      .where("user_id = :userId", { userId })
      .andWhere("used_at IS NULL")
      .execute();
  }
}

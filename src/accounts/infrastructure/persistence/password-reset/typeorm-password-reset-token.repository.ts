import { DataSource, Repository } from "typeorm";
import { PasswordResetToken } from "../../../domain/entities/password-reset/PasswordResetToken";
import { PasswordResetTokenRepository } from "../../../domain/repositories/password-reset/PasswordResetTokenRepository";
import { PasswordResetTokenOrmEntity } from "../entities/password-reset/PasswordResetTokenOrmEntity";
import { PasswordResetTokenMapper } from "../mappers/password-reset/PasswordResetTokenMapper";

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

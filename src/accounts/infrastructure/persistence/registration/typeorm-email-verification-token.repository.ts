import { DataSource, Repository } from "typeorm";
import { EmailVerificationToken } from "../../../domain/entities/registration/EmailVerificationToken";
import { EmailVerificationTokenRepository } from "../../../domain/repositories/registration/EmailVerificationTokenRepository";
import { EmailVerificationTokenOrmEntity } from "../entities/registration/EmailVerificationTokenOrmEntity";
import { EmailVerificationTokenMapper } from "../mappers/registration/EmailVerificationTokenMapper";

export class TypeOrmEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  private readonly ormRepository: Repository<EmailVerificationTokenOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(EmailVerificationTokenOrmEntity);
  }

  async save(token: EmailVerificationToken): Promise<void> {
    await this.ormRepository.save(EmailVerificationTokenMapper.toOrm(token));
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const orm = await this.ormRepository.findOne({ where: { tokenHash } });
    return orm ? EmailVerificationTokenMapper.toDomain(orm) : null;
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

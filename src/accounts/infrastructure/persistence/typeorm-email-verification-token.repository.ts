import { DataSource, Repository } from "typeorm";
import { EmailVerificationToken } from "../../domain/entities/EmailVerificationToken";
import { EmailVerificationTokenRepository } from "../../domain/repositories/EmailVerificationTokenRepository";
import { EmailVerificationTokenOrmEntity } from "./entities/EmailVerificationTokenOrmEntity";
import { EmailVerificationTokenMapper } from "./mappers/EmailVerificationTokenMapper";

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
}

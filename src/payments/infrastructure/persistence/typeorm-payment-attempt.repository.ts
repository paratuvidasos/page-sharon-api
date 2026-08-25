import { DataSource, Repository } from "typeorm";
import { PaymentAttempt } from "../../domain/entities/PaymentAttempt";
import { PaymentAttemptRepository } from "../../domain/repositories/PaymentAttemptRepository";
import { PaymentAttemptOrmEntity } from "./entities/PaymentAttemptOrmEntity";
import { PaymentAttemptMapper } from "./mappers/PaymentAttemptMapper";

export class TypeOrmPaymentAttemptRepository implements PaymentAttemptRepository {
  private readonly ormRepository: Repository<PaymentAttemptOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(PaymentAttemptOrmEntity);
  }

  async save(attempt: PaymentAttempt): Promise<void> {
    await this.ormRepository.save(PaymentAttemptMapper.toOrm(attempt));
  }

  async findByReferenceId(referenceId: string): Promise<PaymentAttempt | null> {
    const orm = await this.ormRepository.findOne({ where: { referenceId } });
    return orm ? PaymentAttemptMapper.toDomain(orm) : null;
  }

  async findByProviderPaymentId(providerPaymentId: string): Promise<PaymentAttempt | null> {
    const orm = await this.ormRepository.findOne({ where: { providerPaymentId } });
    return orm ? PaymentAttemptMapper.toDomain(orm) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentAttempt[]> {
    const rows = await this.ormRepository.find({
      where: { orderId },
      order: { createdAt: "DESC" },
    });
    return rows.map(PaymentAttemptMapper.toDomain);
  }
}

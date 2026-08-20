import { DataSource, Repository } from "typeorm";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { OrderOrmEntity } from "./entities/OrderOrmEntity";

const ANONYMIZED_RECIPIENT_NAME = "Cliente eliminado";
const ANONYMIZED_PHONE = "0000000000";
const ANONYMIZED_STREET_LINE1 = "Dirección eliminada";

export class TypeOrmOrderRepository implements OrderRepository {
  private readonly ormRepository: Repository<OrderOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(OrderOrmEntity);
  }

  async anonymizeShippingSnapshotForUser(userId: string): Promise<void> {
    await this.ormRepository.update(
      { userId },
      {
        shippingRecipientName: ANONYMIZED_RECIPIENT_NAME,
        shippingPhone: ANONYMIZED_PHONE,
        shippingStreetLine1: ANONYMIZED_STREET_LINE1,
        shippingStreetLine2: null,
      },
    );
  }
}

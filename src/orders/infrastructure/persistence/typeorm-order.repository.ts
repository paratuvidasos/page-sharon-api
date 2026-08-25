import { DataSource, Repository } from "typeorm";
import { Order } from "../../domain/entities/Order";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { OrderMapper } from "./mappers/OrderMapper";
import { OrderItemOrmEntity } from "./entities/OrderItemOrmEntity";
import { OrderOrmEntity } from "./entities/OrderOrmEntity";

const ANONYMIZED_RECIPIENT_NAME = "Cliente eliminado";
const ANONYMIZED_PHONE = "0000000000";
const ANONYMIZED_STREET_LINE1 = "Dirección eliminada";

export class TypeOrmOrderRepository implements OrderRepository {
  private readonly ormRepository: Repository<OrderOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(OrderOrmEntity);
  }

  async save(order: Order): Promise<void> {
    const { order: orderOrm, items: itemsOrm } = OrderMapper.toOrm(order);
    await this.dataSource.transaction(async (manager) => {
      await manager.save(OrderOrmEntity, orderOrm);
      await manager.save(OrderItemOrmEntity, itemsOrm);
    });
  }

  /**
   * Solo la fila del pedido. Ver el porqué en `OrderRepository.update`.
   */
  async update(order: Order): Promise<void> {
    const { order: orderOrm } = OrderMapper.toOrm(order);
    await this.ormRepository.save(orderOrm);
  }

  async findById(id: string): Promise<Order | null> {
    return this.findOneBy({ id });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.findOneBy({ orderNumber });
  }

  private async findOneBy(where: { id: string } | { orderNumber: string }): Promise<Order | null> {
    const orderOrm = await this.ormRepository.findOne({ where });
    if (!orderOrm) {
      return null;
    }
    const itemsOrm = await this.dataSource
      .getRepository(OrderItemOrmEntity)
      .find({ where: { orderId: orderOrm.id } });
    return OrderMapper.toDomain(orderOrm, itemsOrm);
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

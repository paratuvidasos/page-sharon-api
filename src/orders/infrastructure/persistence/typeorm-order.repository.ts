import { DataSource, Repository } from "typeorm";
import { Order } from "../../domain/entities/Order";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import { OrderMapper } from "./mappers/OrderMapper";
import { OrderItemOrmEntity } from "./entities/OrderItemOrmEntity";
import { OrderOrmEntity } from "./entities/OrderOrmEntity";
import { OrderStatusHistoryOrmEntity } from "./entities/OrderStatusHistoryOrmEntity";

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
    const historyOrm = OrderMapper.pendingStatusHistoryToOrm(order);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(OrderOrmEntity, orderOrm);
      await manager.save(OrderItemOrmEntity, itemsOrm);
      if (historyOrm.length > 0) {
        await manager.save(OrderStatusHistoryOrmEntity, historyOrm);
      }
    });
  }

  /**
   * La fila del pedido y las entradas de historial que dejó la transición. Los
   * ítems no se tocan: ver el porqué en `OrderRepository.update`.
   *
   * Las dos escrituras van en una transacción porque un estado sin su entrada
   * de historial es peor que no haber cambiado el estado: la pantalla de
   * rastreo mostraría "enviado" sin decir cuándo.
   */
  async update(order: Order): Promise<void> {
    const { order: orderOrm } = OrderMapper.toOrm(order);
    const historyOrm = OrderMapper.pendingStatusHistoryToOrm(order);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(OrderOrmEntity, orderOrm);
      if (historyOrm.length > 0) {
        await manager.save(OrderStatusHistoryOrmEntity, historyOrm);
      }
    });
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
    const [itemsOrm, historyOrm] = await Promise.all([
      this.dataSource.getRepository(OrderItemOrmEntity).find({ where: { orderId: orderOrm.id } }),
      this.dataSource
        .getRepository(OrderStatusHistoryOrmEntity)
        .find({ where: { orderId: orderOrm.id }, order: { changedAt: "ASC" } }),
    ]);
    return OrderMapper.toDomain(orderOrm, itemsOrm, historyOrm);
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

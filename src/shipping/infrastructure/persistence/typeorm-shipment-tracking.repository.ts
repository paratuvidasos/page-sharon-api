import { DataSource, In, Repository } from "typeorm";
import { ShipmentTracking } from "../../domain/entities/ShipmentTracking";
import {
  ACTIVE_TRACKING_STATUSES,
  ShipmentTrackingRepository,
} from "../../domain/repositories/ShipmentTrackingRepository";
import { ShipmentTrackingOrmEntity } from "./entities/ShipmentTrackingOrmEntity";
import { ShipmentTrackingMapper } from "./mappers/ShipmentTrackingMapper";

export class TypeOrmShipmentTrackingRepository implements ShipmentTrackingRepository {
  private readonly ormRepository: Repository<ShipmentTrackingOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(ShipmentTrackingOrmEntity);
  }

  async save(tracking: ShipmentTracking): Promise<void> {
    await this.ormRepository.save(ShipmentTrackingMapper.toOrm(tracking));
  }

  async findByOrderId(orderId: string): Promise<ShipmentTracking | null> {
    const orm = await this.ormRepository.findOne({ where: { orderId } });
    return orm ? ShipmentTrackingMapper.toDomain(orm) : null;
  }

  async findActive(): Promise<ShipmentTracking[]> {
    const rows = await this.ormRepository.find({
      where: { status: In([...ACTIVE_TRACKING_STATUSES]) },
    });
    return rows.map((row) => ShipmentTrackingMapper.toDomain(row));
  }
}

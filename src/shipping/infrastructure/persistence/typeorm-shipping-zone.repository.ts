import { DataSource, Repository } from "typeorm";
import { ShippingZone } from "../../domain/entities/ShippingZone";
import { ShippingZoneRepository } from "../../domain/repositories/ShippingZoneRepository";
import { ShippingRateOrmEntity } from "./entities/ShippingRateOrmEntity";
import { ShippingZoneOrmEntity } from "./entities/ShippingZoneOrmEntity";
import { ShippingZoneProductRestrictionOrmEntity } from "./entities/ShippingZoneProductRestrictionOrmEntity";
import { ShippingZoneMapper } from "./mappers/ShippingZoneMapper";

export class TypeOrmShippingZoneRepository implements ShippingZoneRepository {
  private readonly zoneRepository: Repository<ShippingZoneOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.zoneRepository = dataSource.getRepository(ShippingZoneOrmEntity);
  }

  /**
   * Zona, tarifas y restricciones en una sola transacción: son un mismo
   * agregado y dejar la zona guardada con las tarifas viejas sería una
   * configuración que el administrador nunca pidió.
   *
   * Los hijos se borran y se vuelven a insertar en vez de compararse uno a
   * uno: el panel manda siempre el set completo, y un diff acá solo agregaría
   * una forma de equivocarse sin ahorrar ninguna consulta (son un puñado de
   * filas por zona).
   */
  async save(zone: ShippingZone): Promise<void> {
    const { zone: zoneOrm, rates, restrictions } = ShippingZoneMapper.toOrm(zone);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(ShippingZoneOrmEntity, zoneOrm);

      await manager.delete(ShippingRateOrmEntity, { zoneId: zoneOrm.id });
      if (rates.length > 0) {
        await manager.save(ShippingRateOrmEntity, rates);
      }

      await manager.delete(ShippingZoneProductRestrictionOrmEntity, { zoneId: zoneOrm.id });
      if (restrictions.length > 0) {
        await manager.save(ShippingZoneProductRestrictionOrmEntity, restrictions);
      }
    });
  }

  async findById(id: string): Promise<ShippingZone | null> {
    const zoneOrm = await this.zoneRepository.findOne({ where: { id } });
    if (!zoneOrm) {
      return null;
    }

    const [ratesOrm, restrictionsOrm] = await Promise.all([
      this.dataSource.getRepository(ShippingRateOrmEntity).find({ where: { zoneId: id } }),
      this.dataSource
        .getRepository(ShippingZoneProductRestrictionOrmEntity)
        .find({ where: { zoneId: id } }),
    ]);

    return ShippingZoneMapper.toDomain(zoneOrm, ratesOrm, restrictionsOrm);
  }

  /** Las tarifas y las restricciones se van con la zona por el ON DELETE CASCADE. */
  async delete(id: string): Promise<void> {
    await this.zoneRepository.delete({ id });
  }
}

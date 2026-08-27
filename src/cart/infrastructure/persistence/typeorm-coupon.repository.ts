import { DataSource, Repository } from "typeorm";
import { Coupon } from "../../domain/entities/Coupon";
import { CouponRepository } from "../../domain/repositories/CouponRepository";
import { CouponOrmEntity } from "./entities/CouponOrmEntity";
import { CouponMapper } from "./mappers/CouponMapper";

export class TypeOrmCouponRepository implements CouponRepository {
  private readonly ormRepository: Repository<CouponOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CouponOrmEntity);
  }

  async save(coupon: Coupon): Promise<void> {
    const orm = CouponMapper.toOrm(coupon);
    await this.ormRepository.save(orm);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const orm = await this.ormRepository.findOne({ where: { code: code.toUpperCase() } });
    return orm ? CouponMapper.toDomain(orm) : null;
  }

  async incrementRedemptions(code: string): Promise<void> {
    await this.ormRepository.increment({ code: code.toUpperCase() }, "redemptionsCount", 1);
  }

  async findAll(pagination: { page: number; limit: number }): Promise<{ items: Coupon[]; total: number }> {
    const [rows, total] = await this.ormRepository
      .createQueryBuilder("coupon")
      .orderBy("coupon.createdAt", "DESC")
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return { items: rows.map((row) => CouponMapper.toDomain(row)), total };
  }
}

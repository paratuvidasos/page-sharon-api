import { DataSource, Repository } from "typeorm";
import { UserRole } from "../../domain/enums/UserRole";
import {
  CustomerListFilter,
  CustomerListPage,
  CustomerListPagination,
  UserQueryRepository,
} from "../../domain/repositories/UserQueryRepository";
import { UserOrmEntity } from "./entities/UserOrmEntity";

export class TypeOrmUserQueryRepository implements UserQueryRepository {
  private readonly ormRepository: Repository<UserOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(UserOrmEntity);
  }

  async listCustomers(
    filter: CustomerListFilter,
    pagination: CustomerListPagination,
  ): Promise<CustomerListPage> {
    const query = this.ormRepository
      .createQueryBuilder("user")
      .where("user.role = :role", { role: filter.role ?? UserRole.CUSTOMER });

    if (filter.status) {
      query.andWhere("user.status = :status", { status: filter.status });
    }
    if (filter.search) {
      query.andWhere(
        "(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)",
        { search: `%${filter.search.toLowerCase()}%` },
      );
    }

    query
      .orderBy("user.createdAt", "DESC")
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        status: row.status,
        createdAt: row.createdAt,
      })),
      total,
    };
  }
}

import { DataSource, IsNull, Repository } from "typeorm";
import {
  NotificationPage,
  NotificationQueryRepository,
} from "../../domain/repositories/NotificationQueryRepository";
import { NotificationOrmEntity } from "./entities/NotificationOrmEntity";

export class TypeOrmNotificationQueryRepository implements NotificationQueryRepository {
  private readonly ormRepository: Repository<NotificationOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(NotificationOrmEntity);
  }

  async listForUser(
    userId: string,
    pagination: { page: number; limit: number },
    filter?: { unreadOnly?: boolean },
  ): Promise<NotificationPage> {
    const [rows, total] = await this.ormRepository.findAndCount({
      where: filter?.unreadOnly ? { userId, readAt: IsNull() } : { userId },
      order: { createdAt: "DESC" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        linkUrl: row.linkUrl,
        orderNumber: row.orderNumber,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.ormRepository.count({ where: { userId, readAt: IsNull() } });
  }
}

import { DataSource, IsNull, Repository } from "typeorm";
import { Notification } from "../../domain/entities/Notification";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { NotificationOrmEntity } from "./entities/NotificationOrmEntity";

export class TypeOrmNotificationRepository implements NotificationRepository {
  private readonly ormRepository: Repository<NotificationOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(NotificationOrmEntity);
  }

  async save(notification: Notification): Promise<void> {
    const props = notification.toProps();
    const orm = new NotificationOrmEntity();
    orm.id = props.id;
    orm.userId = props.userId;
    orm.type = props.type;
    orm.title = props.title;
    orm.body = props.body;
    orm.linkUrl = props.linkUrl;
    orm.orderNumber = props.orderNumber;
    orm.readAt = props.readAt;
    orm.createdAt = props.createdAt;

    await this.ormRepository.save(orm);
  }

  async findById(id: string): Promise<Notification | null> {
    const orm = await this.ormRepository.findOne({ where: { id } });
    if (!orm) {
      return null;
    }

    return Notification.reconstitute({
      id: orm.id,
      userId: orm.userId,
      type: orm.type,
      title: orm.title,
      body: orm.body,
      linkUrl: orm.linkUrl,
      orderNumber: orm.orderNumber,
      readAt: orm.readAt,
      createdAt: orm.createdAt,
    });
  }

  async markAllReadForUser(userId: string, readAt: Date): Promise<void> {
    await this.ormRepository.update({ userId, readAt: IsNull() }, { readAt });
  }
}

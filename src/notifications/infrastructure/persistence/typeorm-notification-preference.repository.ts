import { DataSource, Repository } from "typeorm";
import { NotificationPreference } from "../../domain/entities/NotificationPreference";
import { NotificationPreferenceRepository } from "../../domain/repositories/NotificationPreferenceRepository";
import { NotificationPreferenceOrmEntity } from "./entities/NotificationPreferenceOrmEntity";

export class TypeOrmNotificationPreferenceRepository implements NotificationPreferenceRepository {
  private readonly ormRepository: Repository<NotificationPreferenceOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(NotificationPreferenceOrmEntity);
  }

  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const orm = await this.ormRepository.findOne({ where: { userId } });
    if (!orm) {
      return null;
    }

    return NotificationPreference.reconstitute({
      userId: orm.userId,
      emailEnabled: orm.emailEnabled,
      inAppEnabled: orm.inAppEnabled,
    });
  }

  async save(preference: NotificationPreference): Promise<void> {
    const props = preference.toProps();
    const orm = new NotificationPreferenceOrmEntity();
    orm.userId = props.userId;
    orm.emailEnabled = props.emailEnabled;
    orm.inAppEnabled = props.inAppEnabled;

    await this.ormRepository.save(orm);
  }
}

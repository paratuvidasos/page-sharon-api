import { DataSource, Repository } from "typeorm";
import {
  HOMEPAGE_FEATURED_CONFIG_ID,
  HomepageFeaturedConfig,
} from "../../domain/entities/HomepageFeaturedConfig";
import { HomepageFeaturedConfigRepository } from "../../domain/repositories/HomepageFeaturedConfigRepository";
import { HomepageFeaturedConfigOrmEntity } from "./entities/HomepageFeaturedConfigOrmEntity";

export class TypeOrmHomepageFeaturedConfigRepository implements HomepageFeaturedConfigRepository {
  private readonly ormRepository: Repository<HomepageFeaturedConfigOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(HomepageFeaturedConfigOrmEntity);
  }

  /**
   * La migración siembra la fila `default`, así que en el uso normal esto
   * siempre la encuentra. El fallback a `HomepageFeaturedConfig.defaults()`
   * es solo para no romper si alguna vez la fila no existiera (ej. un
   * entorno de test que corre la app sin migraciones).
   */
  async get(): Promise<HomepageFeaturedConfig> {
    const orm = await this.ormRepository.findOne({ where: { id: HOMEPAGE_FEATURED_CONFIG_ID } });
    if (!orm) {
      return HomepageFeaturedConfig.defaults();
    }
    return HomepageFeaturedConfig.reconstitute({
      id: orm.id,
      mode: orm.mode,
      manualProductIds: orm.manualProductIds,
      automaticRule: orm.automaticRule,
    });
  }

  async save(config: HomepageFeaturedConfig): Promise<void> {
    const props = config.toProps();
    const orm = new HomepageFeaturedConfigOrmEntity();
    orm.id = props.id;
    orm.mode = props.mode;
    orm.manualProductIds = props.manualProductIds;
    orm.automaticRule = props.automaticRule;
    await this.ormRepository.save(orm);
  }
}

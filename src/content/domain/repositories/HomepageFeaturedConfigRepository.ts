import { HomepageFeaturedConfig } from "../entities/HomepageFeaturedConfig";

/** [0066]: puerto de la fila singleton de configuración de destacados de home. */
export interface HomepageFeaturedConfigRepository {
  get(): Promise<HomepageFeaturedConfig>;

  save(config: HomepageFeaturedConfig): Promise<void>;
}

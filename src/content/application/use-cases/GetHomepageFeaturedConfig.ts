import { HomepageFeaturedConfigProps } from "../../domain/entities/HomepageFeaturedConfig";
import { HomepageFeaturedConfigRepository } from "../../domain/repositories/HomepageFeaturedConfigRepository";

/** [0066]: configuración vigente de destacados de home, para el panel administrativo. */
export class GetHomepageFeaturedConfig {
  constructor(private readonly homepageFeaturedConfigRepository: HomepageFeaturedConfigRepository) {}

  async execute(): Promise<HomepageFeaturedConfigProps> {
    const config = await this.homepageFeaturedConfigRepository.get();
    return config.toProps();
  }
}

import { AutomaticFeaturedRule } from "../../domain/enums/AutomaticFeaturedRule";
import { FeaturedSelectionMode } from "../../domain/enums/FeaturedSelectionMode";
import { HomepageFeaturedConfigRepository } from "../../domain/repositories/HomepageFeaturedConfigRepository";

export interface SetHomepageFeaturedConfigInput {
  mode: FeaturedSelectionMode;
  manualProductIds?: string[];
  automaticRule?: AutomaticFeaturedRule;
}

/** [0066]: el admin elige entre destacados manuales o una regla automática. */
export class SetHomepageFeaturedConfig {
  constructor(private readonly homepageFeaturedConfigRepository: HomepageFeaturedConfigRepository) {}

  async execute(input: SetHomepageFeaturedConfigInput): Promise<void> {
    const config = await this.homepageFeaturedConfigRepository.get();
    config.set(input);
    await this.homepageFeaturedConfigRepository.save(config);
  }
}

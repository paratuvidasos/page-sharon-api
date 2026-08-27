import { Banner } from "../entities/Banner";

export interface BannerRepository {
  save(banner: Banner): Promise<void>;

  findById(id: string): Promise<Banner | null>;

  delete(id: string): Promise<void>;

  /** [0066]: `ReorderBanners` necesita hidratar el set completo para reasignar `sortOrder`. */
  findByIds(ids: string[]): Promise<Banner[]>;
}

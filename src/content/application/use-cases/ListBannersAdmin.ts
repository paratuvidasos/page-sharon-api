import { BannerListItem, BannerQueryRepository } from "../../domain/repositories/BannerQueryRepository";

/** [0066]: listado completo de banners para el panel administrativo (incluye inactivos/programados). */
export class ListBannersAdmin {
  constructor(private readonly bannerQueryRepository: BannerQueryRepository) {}

  async execute(): Promise<BannerListItem[]> {
    return this.bannerQueryRepository.listForAdmin();
  }
}

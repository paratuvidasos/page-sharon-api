import { BannerNotFoundException } from "../../domain/exceptions/BannerNotFoundException";
import { BannerRepository } from "../../domain/repositories/BannerRepository";

export interface UpdateBannerInput {
  bannerId: string;
  imageUrl?: string;
  linkUrl?: string | null;
  title?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
}

/** [0066]: edición de un banner (el orden se cambia con `ReorderBanners`). */
export class UpdateBanner {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(input: UpdateBannerInput): Promise<void> {
    const banner = await this.bannerRepository.findById(input.bannerId);
    if (!banner) {
      throw new BannerNotFoundException();
    }

    banner.update({
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    });
    await this.bannerRepository.save(banner);
  }
}

import { InvalidBannerException } from "../../domain/exceptions/InvalidBannerException";
import { BannerRepository } from "../../domain/repositories/BannerRepository";

/**
 * [0066]: recibe la lista ordenada completa de ids (lo que produce un
 * drag-and-drop) y reasigna `sortOrder` según la posición — mismo criterio
 * que `ShippingZone.replaceRates`: el panel manda el set completo.
 */
export class ReorderBanners {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(input: { bannerIds: string[] }): Promise<void> {
    const banners = await this.bannerRepository.findByIds(input.bannerIds);
    if (banners.length !== input.bannerIds.length) {
      throw new InvalidBannerException("Alguno de los banners indicados no existe.");
    }

    const bannersById = new Map(banners.map((banner) => [banner.id, banner]));
    await Promise.all(
      input.bannerIds.map((bannerId, index) => {
        const banner = bannersById.get(bannerId)!;
        banner.reorder(index);
        return this.bannerRepository.save(banner);
      }),
    );
  }
}

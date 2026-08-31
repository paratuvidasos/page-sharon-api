import { BannerNotFoundException } from "../../domain/exceptions/BannerNotFoundException";
import { BannerRepository } from "../../domain/repositories/BannerRepository";

/** [0066]: baja de un banner. */
export class DeleteBanner {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(input: { bannerId: string }): Promise<void> {
    const banner = await this.bannerRepository.findById(input.bannerId);
    if (!banner) {
      throw new BannerNotFoundException();
    }
    await this.bannerRepository.delete(input.bannerId);
  }
}

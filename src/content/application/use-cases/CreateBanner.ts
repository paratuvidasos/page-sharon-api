import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { Banner } from "../../domain/entities/Banner";
import { BannerQueryRepository } from "../../domain/repositories/BannerQueryRepository";
import { BannerRepository } from "../../domain/repositories/BannerRepository";

export interface CreateBannerInput {
  imageUrl: string;
  linkUrl?: string | null;
  title: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
}

/** [0066]: alta de un banner — se agrega al final del orden actual. */
export class CreateBanner {
  constructor(
    private readonly bannerRepository: BannerRepository,
    private readonly bannerQueryRepository: BannerQueryRepository,
  ) {}

  async execute(input: CreateBannerInput): Promise<{ id: string }> {
    const existing = await this.bannerQueryRepository.listForAdmin();
    const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((item) => item.sortOrder)) + 1 : 0;

    const banner = Banner.create({ id: generateId(), sortOrder: nextSortOrder, ...input });
    await this.bannerRepository.save(banner);
    return { id: banner.id };
  }
}

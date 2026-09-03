import { BannerPlacement } from "../../domain/enums/BannerPlacement";
import { BannerListItem, BannerQueryRepository } from "../../domain/repositories/BannerQueryRepository";

export interface GetActiveBannersInput {
  /** Sin definir = todos los lugares (comportamiento histórico de `GET /banners`). */
  placement?: BannerPlacement;
}

/**
 * [0066]: banners vigentes para la home pública — sin auth, query en vivo
 * contra `isActive`/`startsAt`/`endsAt`, sin caché que invalidar. Es lo que
 * hace que "los cambios se reflejen en la home sin despliegue técnico" (AC).
 */
export class GetActiveBanners {
  constructor(private readonly bannerQueryRepository: BannerQueryRepository) {}

  async execute(input: GetActiveBannersInput = {}): Promise<BannerListItem[]> {
    return this.bannerQueryRepository.listActiveForHomepage(new Date(), input.placement);
  }
}

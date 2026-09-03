import { Request, Response } from "express";
import { GetActiveBanners } from "../../application/use-cases/GetActiveBanners";
import { GetHomepageFeaturedProducts } from "../../application/use-cases/GetHomepageFeaturedProducts";
import { ListPublicBannersQuerySchema } from "./schemas/public-content.schema";

/** [0066]: endpoints públicos, sin auth — la home los consume directamente. */
export class ContentController {
  constructor(
    private readonly getActiveBanners: GetActiveBanners,
    private readonly getHomepageFeaturedProducts: GetHomepageFeaturedProducts,
  ) {}

  listBanners = async (req: Request, res: Response): Promise<void> => {
    const { placement } = ListPublicBannersQuerySchema.parse(req.query);
    const banners = await this.getActiveBanners.execute({ placement });
    res.status(200).json({
      items: banners.map((banner) => ({
        id: banner.id,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        title: banner.title,
        category: banner.category,
        actionType: banner.actionType,
        placements: banner.placements,
      })),
    });
  };

  listFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
    const items = await this.getHomepageFeaturedProducts.execute({ locale: req.locale });
    res.status(200).json({ items });
  };
}

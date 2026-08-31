import { Request, Response } from "express";
import { GetActiveBanners } from "../../application/use-cases/GetActiveBanners";
import { GetHomepageFeaturedProducts } from "../../application/use-cases/GetHomepageFeaturedProducts";

/** [0066]: endpoints públicos, sin auth — la home los consume directamente. */
export class ContentController {
  constructor(
    private readonly getActiveBanners: GetActiveBanners,
    private readonly getHomepageFeaturedProducts: GetHomepageFeaturedProducts,
  ) {}

  listBanners = async (_req: Request, res: Response): Promise<void> => {
    const banners = await this.getActiveBanners.execute();
    res.status(200).json({
      items: banners.map((banner) => ({
        id: banner.id,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        title: banner.title,
      })),
    });
  };

  listFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
    const items = await this.getHomepageFeaturedProducts.execute({ locale: req.locale });
    res.status(200).json({ items });
  };
}

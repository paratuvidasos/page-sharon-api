import { Router } from "express";
import { DataSource } from "typeorm";
import { buildFileStorage } from "../../../shared-kernel/infrastructure/storage/build-file-storage";
import { CreateBanner } from "../../application/use-cases/CreateBanner";
import { DeleteBanner } from "../../application/use-cases/DeleteBanner";
import { GetActiveBanners } from "../../application/use-cases/GetActiveBanners";
import { GetHomepageFeaturedConfig } from "../../application/use-cases/GetHomepageFeaturedConfig";
import {
  GetHomepageFeaturedProducts,
  GetProductsByIdsPort,
  ListProductsPort,
} from "../../application/use-cases/GetHomepageFeaturedProducts";
import { ListBannersAdmin } from "../../application/use-cases/ListBannersAdmin";
import { ReorderBanners } from "../../application/use-cases/ReorderBanners";
import { SetHomepageFeaturedConfig } from "../../application/use-cases/SetHomepageFeaturedConfig";
import { UpdateBanner } from "../../application/use-cases/UpdateBanner";
import { UploadBannerImage } from "../../application/use-cases/UploadBannerImage";
import { TypeOrmBannerQueryRepository } from "../persistence/typeorm-banner-query.repository";
import { TypeOrmBannerRepository } from "../persistence/typeorm-banner.repository";
import { TypeOrmHomepageFeaturedConfigRepository } from "../persistence/typeorm-homepage-featured-config.repository";
import { ContentController } from "./content.controller";
import { buildContentRoutes } from "./content.routes";

export interface ContentModule {
  /** [0066]: público, montado directo — ver `content.routes.ts`. */
  router: Router;
  createBanner: CreateBanner;
  updateBanner: UpdateBanner;
  deleteBanner: DeleteBanner;
  reorderBanners: ReorderBanners;
  listBannersAdmin: ListBannersAdmin;
  uploadBannerImage: UploadBannerImage;
  setHomepageFeaturedConfig: SetHomepageFeaturedConfig;
  getHomepageFeaturedConfig: GetHomepageFeaturedConfig;
}

export function buildContentModule(
  dataSource: DataSource,
  getProductsByIdsPort: GetProductsByIdsPort,
  listTopSellingPort: ListProductsPort,
  listNewestPort: ListProductsPort,
): ContentModule {
  const bannerRepository = new TypeOrmBannerRepository(dataSource);
  const bannerQueryRepository = new TypeOrmBannerQueryRepository(dataSource);
  const homepageFeaturedConfigRepository = new TypeOrmHomepageFeaturedConfigRepository(dataSource);
  const fileStorage = buildFileStorage();

  const createBanner = new CreateBanner(bannerRepository, bannerQueryRepository);
  const updateBanner = new UpdateBanner(bannerRepository);
  const deleteBanner = new DeleteBanner(bannerRepository);
  const reorderBanners = new ReorderBanners(bannerRepository);
  const listBannersAdmin = new ListBannersAdmin(bannerQueryRepository);
  const uploadBannerImage = new UploadBannerImage(fileStorage);
  const getActiveBanners = new GetActiveBanners(bannerQueryRepository);

  const setHomepageFeaturedConfig = new SetHomepageFeaturedConfig(homepageFeaturedConfigRepository);
  const getHomepageFeaturedConfig = new GetHomepageFeaturedConfig(homepageFeaturedConfigRepository);
  const getHomepageFeaturedProducts = new GetHomepageFeaturedProducts(
    homepageFeaturedConfigRepository,
    getProductsByIdsPort,
    listTopSellingPort,
    listNewestPort,
  );

  const controller = new ContentController(getActiveBanners, getHomepageFeaturedProducts);

  return {
    router: buildContentRoutes(controller),
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
    listBannersAdmin,
    uploadBannerImage,
    setHomepageFeaturedConfig,
    getHomepageFeaturedConfig,
  };
}

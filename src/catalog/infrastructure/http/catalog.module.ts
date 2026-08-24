import { Router } from "express";
import { DataSource } from "typeorm";
import { OrderPlaced } from "../../../shared-kernel/domain/events/OrderPlaced";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { AutocompleteProducts } from "../../application/use-cases/AutocompleteProducts";
import { GetCartProductSnapshots } from "../../application/use-cases/GetCartProductSnapshots";
import { GetProductDetail } from "../../application/use-cases/GetProductDetail";
import { GetProductFilterFacets } from "../../application/use-cases/GetProductFilterFacets";
import { ListCategories } from "../../application/use-cases/ListCategories";
import { ListFeaturedProducts } from "../../application/use-cases/ListFeaturedProducts";
import { ListProducts } from "../../application/use-cases/ListProducts";
import { ListRelatedProducts } from "../../application/use-cases/ListRelatedProducts";
import { RecordProductSale } from "../../application/use-cases/RecordProductSale";
import { SearchProducts } from "../../application/use-cases/SearchProducts";
import { SetProductFeatured } from "../../application/use-cases/SetProductFeatured";
import { RatingSummaryPort } from "../../application/ports/RatingSummaryPort";
import { TypeOrmCategoryQueryRepository } from "../persistence/typeorm-category-query.repository";
import { TypeOrmProductQueryRepository } from "../persistence/typeorm-product-query.repository";
import { TypeOrmProductRepository } from "../persistence/typeorm-product.repository";
import { CatalogController } from "./catalog.controller";
import { buildCategoriesRoutes, buildProductsRoutes } from "./catalog.routes";

export interface CatalogModule {
  productsRouter: Router;
  categoriesRouter: Router;
  setProductFeatured: SetProductFeatured;
  getCartProductSnapshots: GetCartProductSnapshots;
}

export function buildCatalogModule(
  dataSource: DataSource,
  ratingSummaryPort?: RatingSummaryPort,
): CatalogModule {
  const productRepository = new TypeOrmProductRepository(dataSource);
  const productQueryRepository = new TypeOrmProductQueryRepository(dataSource);
  const categoryQueryRepository = new TypeOrmCategoryQueryRepository(dataSource);

  const listProducts = new ListProducts(productQueryRepository, ratingSummaryPort);
  const getProductDetail = new GetProductDetail(productRepository, ratingSummaryPort);
  const listCategories = new ListCategories(categoryQueryRepository);
  const getProductFilterFacets = new GetProductFilterFacets(productQueryRepository);
  const searchProducts = new SearchProducts(productQueryRepository, ratingSummaryPort);
  const autocompleteProducts = new AutocompleteProducts(productQueryRepository);
  const listRelatedProducts = new ListRelatedProducts(
    productRepository,
    productQueryRepository,
    ratingSummaryPort,
  );
  const listFeaturedProducts = new ListFeaturedProducts(productQueryRepository, ratingSummaryPort);
  const setProductFeatured = new SetProductFeatured(productRepository);
  const getCartProductSnapshots = new GetCartProductSnapshots(productQueryRepository);

  const recordProductSale = new RecordProductSale(productRepository);
  domainEventBus.subscribe(OrderPlaced.eventName, async (event) => {
    await recordProductSale.execute({ items: (event as OrderPlaced).items });
  });

  const controller = new CatalogController(
    listProducts,
    getProductDetail,
    listCategories,
    getProductFilterFacets,
    searchProducts,
    autocompleteProducts,
    listRelatedProducts,
    listFeaturedProducts,
  );

  return {
    productsRouter: buildProductsRoutes(controller),
    categoriesRouter: buildCategoriesRoutes(controller),
    setProductFeatured,
    getCartProductSnapshots,
  };
}

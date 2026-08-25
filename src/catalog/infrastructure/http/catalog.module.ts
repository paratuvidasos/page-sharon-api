import { Router } from "express";
import { DataSource } from "typeorm";
import { OrderPaid } from "../../../shared-kernel/domain/events/OrderPaid";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { AutocompleteProducts } from "../../application/use-cases/AutocompleteProducts";
import { CommitStockReservation } from "../../application/use-cases/CommitStockReservation";
import { ExpireStaleReservations } from "../../application/use-cases/ExpireStaleReservations";
import { GetCartProductSnapshots } from "../../application/use-cases/GetCartProductSnapshots";
import { ReleaseStockReservation } from "../../application/use-cases/ReleaseStockReservation";
import { ReserveStock } from "../../application/use-cases/ReserveStock";
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
import { TypeOrmStockReservationRepository } from "../persistence/typeorm-stock-reservation.repository";
import { CatalogController } from "./catalog.controller";
import { buildCategoriesRoutes, buildProductsRoutes } from "./catalog.routes";

export interface CatalogModule {
  productsRouter: Router;
  categoriesRouter: Router;
  setProductFeatured: SetProductFeatured;
  getCartProductSnapshots: GetCartProductSnapshots;
  /** [0038]: puertos de reserva de stock que `orders` consume durante el checkout. */
  reserveStock: ReserveStock;
  commitStockReservation: CommitStockReservation;
  releaseStockReservation: ReleaseStockReservation;
  expireStaleReservations: ExpireStaleReservations;
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

  const stockReservationRepository = new TypeOrmStockReservationRepository(dataSource);
  const reserveStock = new ReserveStock(stockReservationRepository);
  const commitStockReservation = new CommitStockReservation(stockReservationRepository);
  const releaseStockReservation = new ReleaseStockReservation(stockReservationRepository);
  const expireStaleReservations = new ExpireStaleReservations(stockReservationRepository);

  // Se cuenta la venta al pagarse el pedido, no al colocarse: antes de que
  // existiera el flujo de pago, "colocado" era lo más cerca de "vendido" que
  // había, pero ahora un pedido colocado puede quedarse sin pagar nunca.
  const recordProductSale = new RecordProductSale(productRepository);
  domainEventBus.subscribe(OrderPaid.eventName, async (event) => {
    await recordProductSale.execute({ items: (event as OrderPaid).items });
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
    reserveStock,
    commitStockReservation,
    releaseStockReservation,
    expireStaleReservations,
  };
}

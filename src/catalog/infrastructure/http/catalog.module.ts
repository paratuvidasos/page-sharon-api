import { Router } from "express";
import { DataSource } from "typeorm";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { OrderPaid } from "../../../shared-kernel/domain/events/OrderPaid";
import { domainEventBus } from "../../../shared-kernel/infrastructure/events/InMemoryDomainEventBus";
import { buildFileStorage } from "../../../shared-kernel/infrastructure/storage/build-file-storage";
import { AddProductVariant } from "../../application/use-cases/AddProductVariant";
import { AdjustVariantStock } from "../../application/use-cases/AdjustVariantStock";
import { AutocompleteProducts } from "../../application/use-cases/AutocompleteProducts";
import { CommitStockReservation } from "../../application/use-cases/CommitStockReservation";
import { CreateAttributeDefinition } from "../../application/use-cases/CreateAttributeDefinition";
import { CreateCategory } from "../../application/use-cases/CreateCategory";
import { CreateProduct } from "../../application/use-cases/CreateProduct";
import { DeleteAttributeDefinition } from "../../application/use-cases/DeleteAttributeDefinition";
import { DeleteCategory } from "../../application/use-cases/DeleteCategory";
import { DeleteProduct } from "../../application/use-cases/DeleteProduct";
import { ExpireStaleReservations } from "../../application/use-cases/ExpireStaleReservations";
import { GetCartProductSnapshots } from "../../application/use-cases/GetCartProductSnapshots";
import { GetProductsByIds } from "../../application/use-cases/GetProductsByIds";
import { ListNewestProducts } from "../../application/use-cases/ListNewestProducts";
import { ListTopSellingProducts } from "../../application/use-cases/ListTopSellingProducts";
import { ListAttributeDefinitions } from "../../application/use-cases/ListAttributeDefinitions";
import { ListInventory } from "../../application/use-cases/ListInventory";
import { ListLowStockVariants } from "../../application/use-cases/ListLowStockVariants";
import { ReleaseStockReservation } from "../../application/use-cases/ReleaseStockReservation";
import { RemoveProductVariant } from "../../application/use-cases/RemoveProductVariant";
import { ReserveStock } from "../../application/use-cases/ReserveStock";
import { ReverseCommittedStock } from "../../application/use-cases/ReverseCommittedStock";
import { SetProductTranslations } from "../../application/use-cases/SetProductTranslations";
import { GetProductDetail } from "../../application/use-cases/GetProductDetail";
import { GetProductFilterFacets } from "../../application/use-cases/GetProductFilterFacets";
import { GetTranslationCoverage } from "../../application/use-cases/GetTranslationCoverage";
import { ListCategories } from "../../application/use-cases/ListCategories";
import { ListFeaturedProducts } from "../../application/use-cases/ListFeaturedProducts";
import { ListProducts } from "../../application/use-cases/ListProducts";
import { ListRelatedProducts } from "../../application/use-cases/ListRelatedProducts";
import { RecordProductSale } from "../../application/use-cases/RecordProductSale";
import { SearchProducts } from "../../application/use-cases/SearchProducts";
import { SetProductFeatured } from "../../application/use-cases/SetProductFeatured";
import { SetVariantLowStockThreshold } from "../../application/use-cases/SetVariantLowStockThreshold";
import { UpdateAttributeDefinition } from "../../application/use-cases/UpdateAttributeDefinition";
import { UpdateCategory } from "../../application/use-cases/UpdateCategory";
import { UpdateProduct } from "../../application/use-cases/UpdateProduct";
import { UpdateProductVariant } from "../../application/use-cases/UpdateProductVariant";
import { UploadProductImages } from "../../application/use-cases/UploadProductImages";
import { ProductOrderHistoryPort } from "../../application/ports/ProductOrderHistoryPort";
import { RatingSummaryPort } from "../../application/ports/RatingSummaryPort";
import { TypeOrmAttributeDefinitionRepository } from "../persistence/typeorm-attribute-definition.repository";
import { TypeOrmCategoryQueryRepository } from "../persistence/typeorm-category-query.repository";
import { TypeOrmCategoryRepository } from "../persistence/typeorm-category.repository";
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
  /** [0058]: CRUD de categorías y atributos para el panel administrativo. */
  listCategoriesAdmin: ListCategories;
  createCategory: CreateCategory;
  updateCategory: UpdateCategory;
  deleteCategory: DeleteCategory;
  createAttributeDefinition: CreateAttributeDefinition;
  updateAttributeDefinition: UpdateAttributeDefinition;
  deleteAttributeDefinition: DeleteAttributeDefinition;
  listAttributeDefinitions: ListAttributeDefinitions;
  /** [0057]: CRUD de productos y variantes para el panel administrativo. */
  createProduct: CreateProduct;
  updateProduct: UpdateProduct;
  deleteProduct: DeleteProduct;
  addProductVariant: AddProductVariant;
  updateProductVariant: UpdateProductVariant;
  removeProductVariant: RemoveProductVariant;
  uploadProductImages: UploadProductImages;
  /** [0059]: inventario y stock por variante para el panel administrativo. */
  adjustVariantStock: AdjustVariantStock;
  setVariantLowStockThreshold: SetVariantLowStockThreshold;
  listLowStockVariants: ListLowStockVariants;
  listInventory: ListInventory;
  /** [0060]: puerto que `orders` consume para revertir stock de un pedido pagado cancelado/reembolsado. */
  reverseCommittedStock: ReverseCommittedStock;
  /** [0066]: puertos que `content` consume para los destacados de home. */
  getProductsByIds: GetProductsByIds;
  listTopSellingProducts: ListTopSellingProducts;
  listNewestProducts: ListNewestProducts;
  /** [0069]: traducciones y cobertura para el panel administrativo. */
  setProductTranslations: SetProductTranslations;
  getTranslationCoverage: GetTranslationCoverage;
}

export function buildCatalogModule(
  dataSource: DataSource,
  ratingSummaryPort: RatingSummaryPort | undefined,
  productOrderHistoryPort: ProductOrderHistoryPort,
  supportedLocales: Locale[],
): CatalogModule {
  const productRepository = new TypeOrmProductRepository(dataSource);
  const productQueryRepository = new TypeOrmProductQueryRepository(dataSource);
  const categoryQueryRepository = new TypeOrmCategoryQueryRepository(dataSource);
  const categoryRepository = new TypeOrmCategoryRepository(dataSource);
  const attributeDefinitionRepository = new TypeOrmAttributeDefinitionRepository(dataSource);

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

  // [0058]: CRUD de categorías y atributos para el panel administrativo.
  const listCategoriesAdmin = new ListCategories(categoryQueryRepository);
  const createCategory = new CreateCategory(categoryRepository);
  const updateCategory = new UpdateCategory(categoryRepository);
  const deleteCategory = new DeleteCategory(categoryRepository, categoryQueryRepository);
  const createAttributeDefinition = new CreateAttributeDefinition(attributeDefinitionRepository);
  const updateAttributeDefinition = new UpdateAttributeDefinition(attributeDefinitionRepository);
  const deleteAttributeDefinition = new DeleteAttributeDefinition(attributeDefinitionRepository);
  const listAttributeDefinitions = new ListAttributeDefinitions(attributeDefinitionRepository);

  // [0057]: CRUD de productos y variantes para el panel administrativo.
  const fileStorage = buildFileStorage();
  const createProduct = new CreateProduct(productRepository, categoryRepository, attributeDefinitionRepository);
  const updateProduct = new UpdateProduct(productRepository, categoryRepository, attributeDefinitionRepository);
  const deleteProduct = new DeleteProduct(productRepository, productOrderHistoryPort);
  const addProductVariant = new AddProductVariant(productRepository);
  const updateProductVariant = new UpdateProductVariant(productRepository);
  const removeProductVariant = new RemoveProductVariant(productRepository);
  const uploadProductImages = new UploadProductImages(productRepository, fileStorage);

  // [0059]: inventario y stock por variante.
  const adjustVariantStock = new AdjustVariantStock(productRepository);
  const setVariantLowStockThreshold = new SetVariantLowStockThreshold(productRepository);
  const listLowStockVariants = new ListLowStockVariants(productQueryRepository);
  const listInventory = new ListInventory(productQueryRepository);

  const stockReservationRepository = new TypeOrmStockReservationRepository(dataSource);
  const reserveStock = new ReserveStock(stockReservationRepository);
  const commitStockReservation = new CommitStockReservation(stockReservationRepository);
  const releaseStockReservation = new ReleaseStockReservation(stockReservationRepository);
  const expireStaleReservations = new ExpireStaleReservations(stockReservationRepository);
  const reverseCommittedStock = new ReverseCommittedStock(stockReservationRepository);

  // [0066]: destacados de home para el módulo `content`.
  const getProductsByIds = new GetProductsByIds(productQueryRepository);
  const listTopSellingProducts = new ListTopSellingProducts(productQueryRepository);
  const listNewestProducts = new ListNewestProducts(productQueryRepository);
  const setProductTranslations = new SetProductTranslations(productRepository);
  const getTranslationCoverage = new GetTranslationCoverage(productQueryRepository, supportedLocales);

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
    listCategoriesAdmin,
    createCategory,
    updateCategory,
    deleteCategory,
    createAttributeDefinition,
    updateAttributeDefinition,
    deleteAttributeDefinition,
    listAttributeDefinitions,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductVariant,
    updateProductVariant,
    removeProductVariant,
    uploadProductImages,
    adjustVariantStock,
    setVariantLowStockThreshold,
    listLowStockVariants,
    listInventory,
    reverseCommittedStock,
    getProductsByIds,
    listTopSellingProducts,
    listNewestProducts,
    setProductTranslations,
    getTranslationCoverage,
  };
}

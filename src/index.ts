import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { buildAccountsModule } from "./accounts/infrastructure/http/accounts.module";
import { GetOrderSummaryForUsersPort } from "./accounts/application/use-cases/admin/ListCustomers";
import { buildAdminModule } from "./admin/infrastructure/http/admin.module";
import { buildAftersalesModule } from "./aftersales/infrastructure/http/aftersales.module";
import { buildCartModule } from "./cart/infrastructure/http/cart.module";
import { buildCatalogModule } from "./catalog/infrastructure/http/catalog.module";
import { buildContentModule } from "./content/infrastructure/http/content.module";
import { buildNotificationsModule } from "./notifications/infrastructure/http/notifications.module";
import { buildOrdersModule } from "./orders/infrastructure/http/orders.module";
import { buildPaymentsModule } from "./payments/infrastructure/http/payments.module";
import { buildShippingModule } from "./shipping/infrastructure/http/shipping.module";
import { buildWishlistModule } from "./wishlist/infrastructure/http/wishlist.module";
import { AppDataSource } from "./shared-kernel/infrastructure/persistence/data-source";
import { ProductOrderHistoryPort } from "./catalog/application/ports/ProductOrderHistoryPort";
import { RatingSummaryPort } from "./catalog/application/ports/RatingSummaryPort";
import { buildEmailSender } from "./shared-kernel/infrastructure/email/build-email-sender";
import {
  ConfiguredExchangeRateProvider,
  readSupportedCurrencies,
} from "./shared-kernel/infrastructure/exchange/ConfiguredExchangeRateProvider";
import { errorHandler } from "./shared-kernel/infrastructure/http/error-handler";
import { getOpenApiDocument } from "./shared-kernel/infrastructure/swagger/registry";

const port = process.env.PORT ?? 3000;

/** Cada cuánto se barren las reservas de stock vencidas. */
const RESERVATION_SWEEP_INTERVAL_MS = 5 * 60_000;

function readReservationTtlMinutes(): number {
  const raw = Number(process.env.STOCK_RESERVATION_TTL_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

  const payments = buildPaymentsModule(AppDataSource);
  // Antes del express.json() global: el webhook de la pasarela verifica su
  // firma sobre el body crudo, y volver a serializar el JSON cambiaría el
  // espaciado y el orden de las llaves, invalidando el HMAC.
  app.use("/api/v1/payments", payments.router);

  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(process.env.UPLOADS_DIR ?? "uploads"));

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const exchangeRateProvider = new ConfiguredExchangeRateProvider();
  const emailSender = buildEmailSender();

  // [0063]: mismo problema de ciclo que `lazyRatingSummaryPort` — el listado
  // de clientes de `accounts` necesita el resumen de compras de `orders`,
  // pero `orders` se construye después. Nunca se llama antes de que `orders`
  // exista en la práctica: el puerto solo se invoca al atender un HTTP
  // request, después de que bootstrap() terminó de construir todo.
  let getOrderSummaryForUsersPort: GetOrderSummaryForUsersPort | null = null;
  const lazyGetOrderSummaryForUsersPort: GetOrderSummaryForUsersPort = {
    execute: (input) =>
      getOrderSummaryForUsersPort
        ? getOrderSummaryForUsersPort.execute(input)
        : Promise.resolve(new Map()),
  };

  const accounts = buildAccountsModule(AppDataSource, lazyGetOrderSummaryForUsersPort);
  app.use("/api/v1/accounts", accounts.router);

  // Hay un ciclo real entre tres módulos: `catalog` necesita el resumen de
  // reseñas de `aftersales`, `aftersales` necesita saber si el usuario compró
  // (de `orders`), y `orders` necesita los puertos de snapshot y reserva de
  // `catalog`. Se rompe con un reenvío perezoso al puerto de reseñas, que se
  // resuelve cuando `aftersales` ya existe.
  //
  // La alternativa —construir `catalog` dos veces— duplicaría su suscripción
  // a `OrderPaid` y contaría cada venta dos veces en `sales_count`.
  let ratingSummaryPort: RatingSummaryPort | null = null;
  const lazyRatingSummaryPort: RatingSummaryPort = {
    execute: (input) =>
      ratingSummaryPort
        ? ratingSummaryPort.execute(input)
        : Promise.resolve(new Map()),
  };

  // [0057]: mismo problema de ciclo — `DeleteProduct` (dentro de `catalog`)
  // necesita saber si `orders` tiene pedidos de un producto, pero `orders` se
  // construye después porque depende de los puertos de reserva de stock de
  // `catalog`. Se resuelve igual que `lazyRatingSummaryPort`: un reenvío
  // perezoso que se activa cuando `orders` ya existe. Nunca se llama antes de
  // eso en la práctica: `DeleteProduct` solo se invoca vía HTTP, después de
  // que bootstrap() terminó de construir todos los módulos.
  let productOrderHistoryPort: ProductOrderHistoryPort | null = null;
  const lazyProductOrderHistoryPort: ProductOrderHistoryPort = {
    execute: (input) =>
      productOrderHistoryPort
        ? productOrderHistoryPort.execute(input)
        : Promise.resolve(false),
  };

  const catalog = buildCatalogModule(AppDataSource, lazyRatingSummaryPort, lazyProductOrderHistoryPort);
  const cart = buildCartModule(AppDataSource, catalog.getCartProductSnapshots);

  // Después de `catalog` porque desde [0048] `shipping` necesita las medidas
  // de las variantes para cotizar el bulto con la transportadora.
  const shipping = buildShippingModule(
    AppDataSource,
    exchangeRateProvider,
    catalog.getCartProductSnapshots,
  );
  app.use("/api/v1/shipping", shipping.router);

  const orders = buildOrdersModule(AppDataSource, {
    catalogSnapshotPort: catalog.getCartProductSnapshots,
    shippingAddressPort: accounts.getAddressById,
    customerContactPort: accounts.getCustomerContact,
    shippingQuotePort: shipping.quoteShippingMethod,
    shippingRestrictionPort: shipping.checkShippingRestrictions,
    couponPort: cart.quoteCoupon,
    redeemCouponPort: cart.redeemCoupon,
    clearCartPort: cart.clearCartForUser,
    reserveStockPort: catalog.reserveStock,
    commitStockReservationPort: catalog.commitStockReservation,
    releaseStockReservationPort: catalog.releaseStockReservation,
    reverseCommittedStockPort: catalog.reverseCommittedStock,
    paymentSessionPort: payments.startPaymentAttempt,
    exchangeRateProvider,
    emailSender,
    registerUserForCheckout: accounts.registerUserForCheckout,
    loginUser: accounts.loginUser,
    supportedCurrencies: readSupportedCurrencies(),
    reservationTtlMinutes: readReservationTtlMinutes(),
  });
  app.use("/api/v1/orders", orders.router);
  productOrderHistoryPort = orders.hasProductBeenOrdered;
  getOrderSummaryForUsersPort = orders.getOrderSummaryForUsers;

  app.use("/api/v1/wishlist", buildWishlistModule(AppDataSource));

  // [0044]: se suscribe a los cambios de estado que publica `orders`, así que
  // se construye después de él.
  app.use("/api/v1/notifications", buildNotificationsModule(AppDataSource, emailSender));

  const aftersales = buildAftersalesModule(
    AppDataSource,
    orders.hasUserPurchasedProduct,
    accounts.getCustomerContact,
  );
  app.use("/api/v1/products/:productId/reviews", aftersales.reviewsRouter);

  ratingSummaryPort = aftersales.getRatingSummaryForProducts;

  app.use("/api/v1/products", catalog.productsRouter);
  app.use("/api/v1/categories", catalog.categoriesRouter);
  app.use("/api/v1/cart", cart.router);

  // [0066]: banners y destacados de home. Después de `catalog` porque
  // consume sus puertos de solo lectura para el modo automático.
  const content = buildContentModule(
    AppDataSource,
    catalog.getProductsByIds,
    catalog.listTopSellingProducts,
    catalog.listNewestProducts,
  );
  app.use("/api/v1", content.router);
  app.use(
    "/api/v1/admin",
    buildAdminModule({
      setProductFeatured: catalog.setProductFeatured,
      createCoupon: cart.createCoupon,
      createShippingZone: shipping.createShippingZone,
      getShippingZoneById: shipping.getShippingZoneById,
      updateShippingZone: shipping.updateShippingZone,
      deleteShippingZone: shipping.deleteShippingZone,
      listShippingZones: shipping.listShippingZones,
      setZoneProductRestrictions: shipping.setZoneProductRestrictions,
      updateOrderFulfillmentStatus: orders.updateOrderFulfillmentStatus,
      listCategoriesAdmin: catalog.listCategoriesAdmin,
      createCategory: catalog.createCategory,
      updateCategory: catalog.updateCategory,
      deleteCategory: catalog.deleteCategory,
      createAttributeDefinition: catalog.createAttributeDefinition,
      updateAttributeDefinition: catalog.updateAttributeDefinition,
      deleteAttributeDefinition: catalog.deleteAttributeDefinition,
      listAttributeDefinitions: catalog.listAttributeDefinitions,
      createProduct: catalog.createProduct,
      updateProduct: catalog.updateProduct,
      deleteProduct: catalog.deleteProduct,
      addProductVariant: catalog.addProductVariant,
      updateProductVariant: catalog.updateProductVariant,
      removeProductVariant: catalog.removeProductVariant,
      uploadProductImages: catalog.uploadProductImages,
      adjustVariantStock: catalog.adjustVariantStock,
      setVariantLowStockThreshold: catalog.setVariantLowStockThreshold,
      listLowStockVariants: catalog.listLowStockVariants,
      listInventory: catalog.listInventory,
      adminListOrders: orders.adminListOrders,
      adminGetOrderByNumber: orders.adminGetOrderByNumber,
      updateCoupon: cart.updateCoupon,
      listCoupons: cart.listCoupons,
      getSalesReport: orders.getSalesReport,
      exportSalesReportCsv: orders.exportSalesReportCsv,
      listCustomers: accounts.listCustomers,
      suspendCustomer: accounts.suspendCustomer,
      reactivateCustomer: accounts.reactivateCustomer,
      listReviewsForModeration: aftersales.listReviewsForModeration,
      approveReview: aftersales.approveReview,
      rejectReview: aftersales.rejectReview,
      hideReview: aftersales.hideReview,
      createBanner: content.createBanner,
      updateBanner: content.updateBanner,
      deleteBanner: content.deleteBanner,
      reorderBanners: content.reorderBanners,
      listBannersAdmin: content.listBannersAdmin,
      uploadBannerImage: content.uploadBannerImage,
      setHomepageFeaturedConfig: content.setHomepageFeaturedConfig,
      getHomepageFeaturedConfig: content.getHomepageFeaturedConfig,
    }),
  );

  app.get("/api/docs.json", (_req, res) => {
    res.json(getOpenApiDocument());
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(getOpenApiDocument()));

  app.use(errorHandler);

  // Devuelve el stock de los checkouts que quedaron abandonados en la
  // pasarela. `ReserveStock` también barre antes de cada reserva; este
  // intervalo cubre el caso de que no entre ninguna compra por un rato.
  setInterval(() => {
    catalog.expireStaleReservations
      .execute()
      .catch((error) => console.error("[catalog] Error al liberar reservas vencidas:", error));
  }, RESERVATION_SWEEP_INTERVAL_MS).unref();

  app.listen(port, () => {
    console.log(`page-sharon-api listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});

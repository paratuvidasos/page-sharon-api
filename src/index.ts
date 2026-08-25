import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { buildAccountsModule } from "./accounts/infrastructure/http/accounts.module";
import { buildAdminModule } from "./admin/infrastructure/http/admin.module";
import { buildAftersalesModule } from "./aftersales/infrastructure/http/aftersales.module";
import { buildCartModule } from "./cart/infrastructure/http/cart.module";
import { buildCatalogModule } from "./catalog/infrastructure/http/catalog.module";
import { buildOrdersModule } from "./orders/infrastructure/http/orders.module";
import { buildPaymentsModule } from "./payments/infrastructure/http/payments.module";
import { buildShippingModule } from "./shipping/infrastructure/http/shipping.module";
import { buildWishlistModule } from "./wishlist/infrastructure/http/wishlist.module";
import { AppDataSource } from "./shared-kernel/infrastructure/persistence/data-source";
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

  const accounts = buildAccountsModule(AppDataSource);
  app.use("/api/v1/accounts", accounts.router);

  const shipping = buildShippingModule(AppDataSource, exchangeRateProvider);
  app.use("/api/v1/shipping", shipping.router);

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

  const catalog = buildCatalogModule(AppDataSource, lazyRatingSummaryPort);
  const cart = buildCartModule(AppDataSource, catalog.getCartProductSnapshots);

  const orders = buildOrdersModule(AppDataSource, {
    catalogSnapshotPort: catalog.getCartProductSnapshots,
    shippingAddressPort: accounts.getAddressById,
    customerContactPort: accounts.getCustomerContact,
    shippingQuotePort: shipping.quoteShippingMethod,
    couponPort: cart.quoteCoupon,
    redeemCouponPort: cart.redeemCoupon,
    clearCartPort: cart.clearCartForUser,
    reserveStockPort: catalog.reserveStock,
    commitStockReservationPort: catalog.commitStockReservation,
    releaseStockReservationPort: catalog.releaseStockReservation,
    paymentSessionPort: payments.startPaymentAttempt,
    exchangeRateProvider,
    emailSender,
    registerUserForCheckout: accounts.registerUserForCheckout,
    loginUser: accounts.loginUser,
    supportedCurrencies: readSupportedCurrencies(),
    reservationTtlMinutes: readReservationTtlMinutes(),
  });
  app.use("/api/v1/orders", orders.router);

  app.use("/api/v1/wishlist", buildWishlistModule(AppDataSource));

  const aftersales = buildAftersalesModule(AppDataSource, orders.hasUserPurchasedProduct);
  app.use("/api/v1/products/:productId/reviews", aftersales.reviewsRouter);

  ratingSummaryPort = aftersales.getRatingSummaryForProducts;

  app.use("/api/v1/products", catalog.productsRouter);
  app.use("/api/v1/categories", catalog.categoriesRouter);
  app.use("/api/v1/cart", cart.router);
  app.use("/api/v1/admin", buildAdminModule(catalog.setProductFeatured, cart.createCoupon));

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

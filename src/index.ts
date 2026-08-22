import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { buildAccountsModule } from "./accounts/infrastructure/http/accounts.module";
import { buildCatalogModule } from "./catalog/infrastructure/http/catalog.module";
import { buildOrdersModule } from "./orders/infrastructure/http/orders.module";
import { buildWishlistModule } from "./wishlist/infrastructure/http/wishlist.module";
import { AppDataSource } from "./shared-kernel/infrastructure/persistence/data-source";
import { errorHandler } from "./shared-kernel/infrastructure/http/error-handler";
import { getOpenApiDocument } from "./shared-kernel/infrastructure/swagger/registry";

const port = process.env.PORT ?? 3000;

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(process.env.UPLOADS_DIR ?? "uploads"));

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const accounts = buildAccountsModule(AppDataSource);
  app.use("/api/v1/accounts", accounts.router);

  const orders = buildOrdersModule(AppDataSource, accounts.registerUserForCheckout, accounts.loginUser);
  app.use("/api/v1/orders", orders.router);

  app.use("/api/v1/wishlist", buildWishlistModule(AppDataSource));

  const catalog = buildCatalogModule(AppDataSource);
  app.use("/api/v1/products", catalog.productsRouter);
  app.use("/api/v1/categories", catalog.categoriesRouter);

  app.get("/api/docs.json", (_req, res) => {
    res.json(getOpenApiDocument());
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(getOpenApiDocument()));

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`page-sharon-api listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});

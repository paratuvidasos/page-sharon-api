import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { buildAccountsModule } from "./accounts/infrastructure/http/accounts.module";
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

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/accounts", buildAccountsModule(AppDataSource));

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

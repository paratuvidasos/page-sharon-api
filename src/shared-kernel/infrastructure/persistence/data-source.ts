import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "page_sharon_dev",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: ["src/*/infrastructure/persistence/entities/*.ts"],
  migrations: ["src/*/infrastructure/persistence/migrations/*.ts"],
});

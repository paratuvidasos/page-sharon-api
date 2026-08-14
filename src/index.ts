import "dotenv/config";
import express from "express";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`page-sharon-api listening on port ${port}`);
});

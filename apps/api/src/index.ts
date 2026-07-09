import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { apiRouter } from "./routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3333);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "kixipay-api" });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

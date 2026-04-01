import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import downloadRouter from "./routes/download.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/download", downloadRouter);

app.get("/", (_req, res) => {
  res.json({ status: "Cliprr server is running" });
});

app.listen(PORT, () => {
  console.log(`Cliprr server running on port ${PORT}`);
});

import { Router } from "express";
import { handleDownload } from "../controllers/download.controller.js";

const router = Router();

router.post("/", handleDownload);

export default router;

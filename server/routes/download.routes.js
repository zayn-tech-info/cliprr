import { Router } from "express";
import {
  handleInfo,
  handleDownload,
  handleCancelDownload,
} from "../controllers/download.controller.js";

const router = Router();

router.post("/", handleDownload);
router.post("/info", handleInfo);
router.post("/cancel", handleCancelDownload);

export default router;

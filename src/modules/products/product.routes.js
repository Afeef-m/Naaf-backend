import express from "express";
import * as controller from "./product.controller.js";

const router = express.Router();

router.get("/", controller.getProducts);
router.get("/featured", controller.getFeaturedProducts);
router.get("/:slug", controller.getProductBySlug);

export default router;
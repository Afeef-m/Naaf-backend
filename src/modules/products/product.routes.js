import express from "express";
import * as controller from "./product.controller.js";
import requireAdmin from "../../middleware/require-admin.js";

const router = express.Router();

router.get("/", controller.getProducts);
router.get("/featured", controller.getFeaturedProducts);
router.get("/:slug", controller.getProductBySlug);

router.post("/", requireAdmin, controller.createProduct);
router.patch("/:id", requireAdmin, controller.updateProduct);
router.delete("/:id", requireAdmin, controller.deleteProduct);

export default router;

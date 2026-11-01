import express from "express";
import * as controller from "./product.controller.js";
import requireAdmin from "../../middleware/require-admin.js";

const router = express.Router();

router.get("/", controller.getProducts);
router.get("/featured", controller.getFeaturedProducts);
router.post(
  "/upload-signature",
  requireAdmin,
  controller.createUploadSignature,
);
router.get("/upload-signature", (req, res) => {
  res.set("Allow", "POST");
  return res
    .status(405)
    .json({ success: false, message: "Method not allowed. Use POST." });
});
router.get("/:slug", controller.getProductBySlug);

router.post("/", requireAdmin, controller.createProduct);
router.patch("/:id", requireAdmin, controller.updateProduct);
router.delete("/:id", requireAdmin, controller.deleteProduct);

export default router;

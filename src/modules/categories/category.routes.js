
import { Router } from "express";
import requireAdmin from "../../middleware/require-admin.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";

const router = Router();

// Public read access for storefront category listings.
router.get("/", getCategories);

// Admin-only changes.
router.post("/", requireAdmin, createCategory);
router.patch("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;

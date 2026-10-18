
import { Router } from "express";
import rateLimit from "express-rate-limit";
import requireAdmin from "../../middleware/require-admin.js";
import {
  login,
  refresh,
  logout,
  me,
} from "./auth.controller.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

// Admin authentication routes
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);
router.get("/me", requireAdmin, me);

export default router;

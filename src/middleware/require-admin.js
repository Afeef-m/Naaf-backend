import jwt from "jsonwebtoken";
import Admin from "../modules/auth/admin.model.js";

export default async function requireAdmin(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    const payload = jwt.verify(token, secret, {
      issuer: "naaf-backend",
      audience: "naaf-admin",
    });

    if (payload.role !== "admin" || typeof payload.sub !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const admin = await Admin.findById(payload.sub).select(
      "_id name email role isActive"
    );

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin account is unavailable",
      });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    if (
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    return next(error);
  }
}

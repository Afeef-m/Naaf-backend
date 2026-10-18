import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export function createAccessToken(admin) {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
    },
    secret,
    {
      expiresIn: "15m",
      issuer: "naaf-backend",
      audience: "naaf-admin",
    }
  );
}

export function createRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
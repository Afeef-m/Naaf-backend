
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import Admin from "./admin.model.js";
import RefreshToken from "./token.model.js";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
} from "../../utils/tokens.js";

const REFRESH_TOKEN_DAYS = 7;

function getRefreshExpiry() {
  return new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
  );
}

function secretsMatch(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

async function issueSession(admin) {
  const refreshToken = createRefreshToken();

  await RefreshToken.create({
    admin: admin._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiry(),
  });

  return {
    accessToken: createAccessToken(admin),
    refreshToken,
    admin: {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
}

export async function setupFirstAdmin({
  name,
  email,
  password,
  setupSecret,
}) {
  const expectedSecret = process.env.ADMIN_SETUP_SECRET;

  if (!secretsMatch(setupSecret, expectedSecret)) {
    const error = new Error("Invalid setup credentials");
    error.statusCode = 403;
    throw error;
  }

  // Never allow this setup operation after an admin already exists.
  if (await Admin.exists({})) {
    const error = new Error("Initial admin setup is already complete");
    error.statusCode = 403;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const admin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "admin",
      isActive: true,
    });

    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };
  } catch (error) {
    // Handle duplicate email or a concurrent setup attempt.
    if (error.code === 11000 || (await Admin.exists({}))) {
      const setupError = new Error(
        "Initial admin setup is already complete or the email is in use"
      );
      setupError.statusCode = 409;
      throw setupError;
    }

    throw error;
  }
}

export async function loginAdmin({ email, password }) {
  const admin = await Admin.findOne({
    email: email.trim().toLowerCase(),
  }).select("+passwordHash");

  // Use the same response for an unknown email and a wrong password.
  if (!admin || !admin.isActive) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    admin.passwordHash
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return issueSession(admin);
}

export async function refreshAdminSession(refreshToken) {
  if (
    typeof refreshToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(refreshToken)
  ) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  if (storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    const error = new Error("Refresh token is expired or revoked");
    error.statusCode = 401;
    throw error;
  }

  const admin = await Admin.findById(storedToken.admin);

  if (!admin || !admin.isActive) {
    const error = new Error("Admin account is unavailable");
    error.statusCode = 401;
    throw error;
  }

  // Rotate the refresh token. Only one request can claim the old token.
  const nextRefreshToken = createRefreshToken();
  const nextTokenHash = hashToken(nextRefreshToken);

  const claimedToken = await RefreshToken.findOneAndUpdate(
    {
      _id: storedToken._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        revokedAt: new Date(),
        replacedByTokenHash: nextTokenHash,
      },
    },
    { new: true }
  );

  if (!claimedToken) {
    const error = new Error("Refresh token has already been used");
    error.statusCode = 401;
    throw error;
  }

  try {
    await RefreshToken.create({
      admin: admin._id,
      tokenHash: nextTokenHash,
      expiresAt: getRefreshExpiry(),
    });
  } catch (error) {
    // If the replacement cannot be saved, revoke the old token permanently.
    throw error;
  }

  return {
    accessToken: createAccessToken(admin),
    refreshToken: nextRefreshToken,
    admin: {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
}

export async function logoutAdmin(refreshToken) {
  if (
    typeof refreshToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(refreshToken)
  ) {
    return;
  }

  await RefreshToken.updateOne(
    {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
}

export async function getCurrentAdmin(adminId) {
  const admin = await Admin.findById(adminId).select(
    "_id name email role isActive"
  );

  if (!admin || !admin.isActive) {
    const error = new Error("Admin account is unavailable");
    error.statusCode = 401;
    throw error;
  }

  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}


import {
  setupFirstAdmin,
  loginAdmin,
  refreshAdminSession,
  logoutAdmin,
  getCurrentAdmin,
} from "./auth.service.js";

function sendError(res, error) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error("Admin authentication error:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "An unexpected error occurred"
        : error.message,
  });
}

export async function setupAdmin(req, res) {
  try {
    const { name, email, password } = req.body || {};
    const setupSecret = req.get("x-admin-setup-secret");

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") < 6 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid name, email, and password of 12–72 bytes",
      });
    }

    const admin = await setupFirstAdmin({
      name,
      email,
      password,
      setupSecret,
    });

    return res.status(201).json({
      success: true,
      message: "Initial admin created successfully",
      admin,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const session = await loginAdmin({ email, password });

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      message: "Login successful",
      ...session,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};

    const session = await refreshAdminSession(refreshToken);

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      ...session,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};

    await logoutAdmin(refreshToken);

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function me(req, res) {
  try {
    const admin = await getCurrentAdmin(req.admin._id);

    return res.json({
      success: true,
      admin,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

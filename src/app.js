import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import productRoutes from "./modules/products/product.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://naaf-glamoria-one.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Naaf API is running" });
});

app.use("/api/v1/products", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({
      message: "Database connection unavailable",
    });
  }
});

app.use("/api/v1/products", productRoutes);

export default app;

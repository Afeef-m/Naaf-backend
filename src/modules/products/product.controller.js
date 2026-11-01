import mongoose from "mongoose";
import * as productService from "./product.service.js";
import cloudinary from "../../config/cloudinary.js";
import { randomUUID } from "node:crypto";
import Product from "./product.model.js";
import { verifyProductImages } from "./product-image.service.js";

const cleanupCloudinaryAssets = async (assets = []) => {
  const publicIds = assets.map((asset) => asset.publicId).filter(Boolean);

  const results = await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      }),
    ),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Cloudinary cleanup failed:", result.reason);
    }
  });
};

export const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    console.log("PRODUCT DATABASE CHECK:", {
      database: mongoose.connection.name,
      collection: "products",
      total: result.pagination.total,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await productService.getFeaturedProducts();

    res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const allowedFields = [
      "slug",
      "name",
      "description",
      "category",
      "price",
      "originalPrice",
      "isFeatured",
      "stock",
    ];

    const data = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );

    const imageAssets = await verifyProductImages(
      req.body.imagePublicIds ?? [],
    );

    data.imageAssets = imageAssets;
    data.images = imageAssets.map((image) => image.url);

    const product = await productService.createProduct(data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const allowedFields = [
      "slug",
      "name",
      "description",
      "category",
      "price",
      "originalPrice",
      "isFeatured",
      "stock",
    ];

    const data = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );

    const existingProduct = await Product.findById(req.params.id);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let removedAssets = [];

    if (Object.hasOwn(req.body, "imagePublicIds")) {
      const newAssets = await verifyProductImages(req.body.imagePublicIds);

      const newPublicIds = new Set(newAssets.map((asset) => asset.publicId));

      removedAssets = existingProduct.imageAssets.filter(
        (asset) => !newPublicIds.has(asset.publicId),
      );

      data.imageAssets = newAssets;
      data.images = newAssets.map((image) => image.url);
    }

    if (
      Object.keys(data).length === 0 &&
      !Object.hasOwn(req.body, "imagePublicIds")
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid product fields provided",
      });
    }

    const product = await productService.updateProduct(req.params.id, data);

    await cleanupCloudinaryAssets(removedAssets);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id);

    await cleanupCloudinaryAssets(product.imageAssets ?? []);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const createUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `naaf-glamoria/products/${randomUUID()}`;

    const paramsToSign = {
      timestamp,
      public_id: publicId,
      overwrite: false,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    );

    return res.status(200).json({
      success: true,
      data: {
        timestamp,
        signature,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        publicId,
        overwrite: false,
      },
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to authorize image upload.",
    });
  }
};

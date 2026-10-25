import * as productService from "./product.service.js";

export const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);

    res.json({
      success: true,
      ...result
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
      data: product
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
      data: products
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
      "images",
      "isFeatured",
      "stock",
    ];

    const data = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

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
      "images",
      "isFeatured",
      "stock",
    ];

    const data = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid product fields provided",
      });
    }

    const product = await productService.updateProduct(
      req.params.id,
      data
    );

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
    await productService.deleteProduct(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

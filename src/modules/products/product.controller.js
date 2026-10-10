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
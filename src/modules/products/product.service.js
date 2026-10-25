import "../categories/category.model.js";
import Product from "./product.model.js";
import mongoose from "mongoose";

export const getAllProducts = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  let sort = {};
  if (query.sort) {
    const order = query.order === "desc" ? -1 : 1;
    sort[query.sort] = order;
  } else {
    sort.createdAt = -1;
  }

  const products = await Product.find(filter)
  .populate("category", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug })
    .populate("category", "name slug")
    .lean();

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const getFeaturedProducts = async () => {
  return await Product.find({ isFeatured: true })
    .limit(8)
    .lean();
};


export const createProduct = async (data) => {
  if (data.category && !mongoose.isValidObjectId(data.category)) {
    throw new Error("Invalid category ID");
  }

  const product = await Product.create(data);

  return product;
};

export const updateProduct = async (id, data) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid product ID");
  }

  if (
    data.category &&
    !mongoose.isValidObjectId(data.category)
  ) {
    throw new Error("Invalid category ID");
  }

  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const deleteProduct = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

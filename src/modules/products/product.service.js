import Product from "./product.model.js";

// Get all products with filtering, sorting, pagination
export const getAllProducts = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  // Filter by category
  if (query.category) {
    filter.category = query.category;
  }

  // Filter by price range
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // Sorting
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

// Get product by slug
export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug })
    .populate("category", "name slug")
    .lean();

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

// Get featured products
export const getFeaturedProducts = async () => {
  return await Product.find({ isFeatured: true })
    .limit(8)
    .lean();
};
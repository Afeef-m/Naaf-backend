
import mongoose from "mongoose";
import Category from "./category.model.js";

export async function getAllCategories() {
  return Category.find({}).sort({ createdAt: -1 }).lean();
}

export async function createCategory(data) {
  const { name, slug } = data;

  if (
    !name ||
    typeof name.en !== "string" ||
    typeof name.ar !== "string" ||
    !name.en.trim() ||
    !name.ar.trim() ||
    typeof slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())
  ) {
    const error = new Error(
      "Provide English and Arabic names and a valid slug"
    );
    error.statusCode = 400;
    throw error;
  }

  return Category.create({
    name: {
      en: name.en.trim(),
      ar: name.ar.trim(),
    },
    slug: slug.trim(),
  });
}

export async function updateCategory(id, data) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid category ID");
    error.statusCode = 400;
    throw error;
  }

  const updates = {};

  if (data.name !== undefined) {
    if (
      !data.name ||
      typeof data.name.en !== "string" ||
      typeof data.name.ar !== "string" ||
      !data.name.en.trim() ||
      !data.name.ar.trim()
    ) {
      const error = new Error("Valid English and Arabic names are required");
      error.statusCode = 400;
      throw error;
    }

    updates.name = {
      en: data.name.en.trim(),
      ar: data.name.ar.trim(),
    };
  }

  if (data.slug !== undefined) {
    if (
      typeof data.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug.trim())
    ) {
      const error = new Error("Invalid category slug");
      error.statusCode = 400;
      throw error;
    }

    updates.slug = data.slug.trim();
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("No valid category fields provided");
    error.statusCode = 400;
    throw error;
  }

  const category = await Category.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
}

export async function deleteCategory(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid category ID");
    error.statusCode = 400;
    throw error;
  }

  // Never delete a category that is still referenced by products.
  const Product = mongoose.model("Product");
  const inUse = await Product.exists({ category: id });

  if (inUse) {
    const error = new Error(
      "This category is assigned to products. Reassign them before deleting."
    );
    error.statusCode = 409;
    throw error;
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
}

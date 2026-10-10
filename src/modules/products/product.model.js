import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true }
    },

    description: {
      en: { type: String, required: true },
      ar: { type: String, required: true }
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    originalPrice: {
      type: Number
    },

    images: {
      type: [String],
      default: []
    },

    rating: {
      type: Number,
      default: 0
    },

    reviewsCount: {
      type: Number,
      default: 0
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    stock: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

/* Indexes for performance */
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model("Product", productSchema);
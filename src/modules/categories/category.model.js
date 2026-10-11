
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true }
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);

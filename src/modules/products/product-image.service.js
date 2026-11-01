import cloudinary from "../../config/cloudinary.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];
const REQUIRED_FOLDER = "naaf-glamoria/products";

export const verifyProductImages = async (publicIds = []) => {
  if (!Array.isArray(publicIds)) {
    throw new Error("Invalid image list.");
  }

  if (publicIds.length > MAX_IMAGES) {
    throw new Error("Maximum 5 images are allowed per product.");
  }

  const uniqueIds = [...new Set(publicIds)];

  if (uniqueIds.length !== publicIds.length) {
    throw new Error("Duplicate image IDs are not allowed.");
  }

  const assets = await Promise.all(
    uniqueIds.map(async (publicId) => {
      if (
        typeof publicId !== "string" ||
        !publicId.startsWith(`${REQUIRED_FOLDER}/`)
      ) {
        throw new Error("Invalid Cloudinary image ID.");
      }

      const asset = await cloudinary.api.resource(publicId, {
        resource_type: "image",
      });

      if (asset.bytes > MAX_IMAGE_SIZE) {
        throw new Error("Each image must be 5 MB or smaller.");
      }

      if (!ALLOWED_FORMATS.includes(asset.format)) {
        throw new Error("Only JPEG, PNG and WebP images are allowed.");
      }

      if (
        asset.resource_type !== "image" ||
        asset.type !== "upload" ||
        asset.format === "svg"
      ) {
        throw new Error("Invalid image asset.");
      }

      return {
        url: asset.secure_url,
        publicId: asset.public_id,
      };
    }),
  );

  return assets;
};

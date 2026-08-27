import multer from "multer";
import { InvalidProductImageFileException } from "../../../catalog/domain/exceptions/InvalidProductImageFileException";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PRODUCT_IMAGE_MAX_SIZE_MB = Number(process.env.PRODUCT_IMAGE_MAX_SIZE_MB ?? 5);
const MAX_IMAGES_PER_UPLOAD = 10;

export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PRODUCT_IMAGE_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new InvalidProductImageFileException("Cada imagen debe ser JPG, PNG o WEBP."));
      return;
    }
    callback(null, true);
  },
}).array("images", MAX_IMAGES_PER_UPLOAD);

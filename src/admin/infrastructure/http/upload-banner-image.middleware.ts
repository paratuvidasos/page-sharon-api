import multer from "multer";
import { InvalidBannerImageFileException } from "../../../content/domain/exceptions/InvalidBannerImageFileException";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const BANNER_IMAGE_MAX_SIZE_MB = Number(process.env.BANNER_IMAGE_MAX_SIZE_MB ?? 5);

export const uploadBannerImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: BANNER_IMAGE_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new InvalidBannerImageFileException("La imagen debe ser JPG, PNG o WEBP."));
      return;
    }
    callback(null, true);
  },
}).single("image");

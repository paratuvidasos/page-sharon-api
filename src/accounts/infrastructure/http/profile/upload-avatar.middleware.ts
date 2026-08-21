import multer from "multer";
import { InvalidAvatarFileException } from "../../../domain/exceptions/profile/InvalidAvatarFileException";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_MAX_SIZE_MB = Number(process.env.AVATAR_MAX_SIZE_MB ?? 5);

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new InvalidAvatarFileException("La foto debe ser JPG, PNG o WEBP."));
      return;
    }
    callback(null, true);
  },
}).single("avatar");

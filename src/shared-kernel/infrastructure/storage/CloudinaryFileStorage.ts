import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { FileStorage, StoredFile, StoredFileInput } from "../../domain/ports/FileStorage";

/**
 * Implementación de `FileStorage` sobre Cloudinary. El SDK lee
 * `CLOUDINARY_URL` de `process.env` automáticamente al cargarse — acá solo
 * se fuerza `secure: true` para que las URLs devueltas sean siempre https
 * (ver `build-file-storage.ts` para cuándo se elige esta implementación en
 * vez de `LocalFileStorage`).
 *
 * `file.folder` (ya usado por `LocalFileStorage` para separar "avatars",
 * "products", "banners" en disco) se mapea 1:1 al folder de Cloudinary, así
 * que los assets quedan organizados igual en ambos backends.
 */
export class CloudinaryFileStorage implements FileStorage {
  constructor() {
    cloudinary.config({ secure: true });
  }

  async save(file: StoredFileInput): Promise<StoredFile> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: file.folder, resource_type: "image" }, (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary no devolvió resultado."));
            return;
          }
          resolve(uploadResult);
        })
        .end(file.buffer);
    });

    return { url: result.secure_url };
  }
}

import { FileStorage } from "../../domain/ports/FileStorage";
import { CloudinaryFileStorage } from "./CloudinaryFileStorage";
import { LocalFileStorage } from "./LocalFileStorage";

/**
 * Con `CLOUDINARY_URL` configurado sube a Cloudinary; si no, cae a disco
 * local — mismo criterio que `buildEmailSender` (Brevo/consola) y los
 * demás integradores externos del repo: nunca falla el arranque por faltar
 * una credencial opcional, degrada con un aviso en consola.
 */
export function buildFileStorage(): FileStorage {
  if (!process.env.CLOUDINARY_URL) {
    console.log("[storage] Sin CLOUDINARY_URL: las imágenes se guardan en disco local (./uploads).");
    return new LocalFileStorage(
      process.env.UPLOADS_DIR ?? "uploads",
      process.env.API_PUBLIC_URL ?? "http://localhost:3000",
    );
  }

  return new CloudinaryFileStorage();
}

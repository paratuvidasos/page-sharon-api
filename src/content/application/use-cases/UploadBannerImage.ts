import { FileStorage } from "../../../shared-kernel/domain/ports/FileStorage";

export interface BannerImageFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

/**
 * [0066]: sube la imagen de un banner y devuelve su URL — el admin la usa
 * después en `imageUrl` al crear o editar el banner. Separado de
 * `CreateBanner`/`UpdateBanner` porque el formulario puede subir la imagen
 * antes de que el banner exista todavía (mismo patrón que las imágenes de
 * producto, [0057]).
 */
export class UploadBannerImage {
  constructor(private readonly fileStorage: FileStorage) {}

  async execute(input: { file: BannerImageFile }): Promise<{ url: string }> {
    return this.fileStorage.save({
      buffer: input.file.buffer,
      mimeType: input.file.mimeType,
      originalName: input.file.originalName,
      folder: "banners",
    });
  }
}

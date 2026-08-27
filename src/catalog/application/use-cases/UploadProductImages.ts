import { FileStorage } from "../../../shared-kernel/domain/ports/FileStorage";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException";
import { ProductRepository } from "../../domain/repositories/ProductRepository";

export interface ProductImageFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

/**
 * [0057]: sube una o más imágenes y las agrega al `images` del producto —
 * mismo puerto `FileStorage` que ya usa el avatar de usuario ([0011]), sin
 * redimensionado server-side (no lo pide el AC, "subir imágenes" alcanza con
 * guardarlas tal cual).
 */
export class UploadProductImages {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { productId: string; files: ProductImageFile[] }): Promise<{ images: string[] }> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundException();
    }

    const uploaded = await Promise.all(
      input.files.map((file) =>
        this.fileStorage.save({
          buffer: file.buffer,
          mimeType: file.mimeType,
          originalName: file.originalName,
          folder: "products",
        }),
      ),
    );

    const props = product.toProps();
    const images = [...props.images, ...uploaded.map((file) => file.url)];
    product.update({ images });
    await this.productRepository.save(product);

    return { images };
  }
}

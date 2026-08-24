import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { FileStorage, StoredFile, StoredFileInput } from "../../domain/ports/FileStorage";
import { generateId } from "../ids/generate-id";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class LocalFileStorage implements FileStorage {
  constructor(
    private readonly uploadsDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  async save(file: StoredFileInput): Promise<StoredFile> {
    const extension = MIME_EXTENSIONS[file.mimeType] ?? "bin";
    const fileName = `${generateId()}.${extension}`;
    const folderPath = path.join(this.uploadsDir, file.folder);
    await mkdir(folderPath, { recursive: true });
    await writeFile(path.join(folderPath, fileName), file.buffer);

    return { url: `${this.publicBaseUrl}/uploads/${file.folder}/${fileName}` };
  }
}

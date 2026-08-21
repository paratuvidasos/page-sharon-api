export interface StoredFileInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  folder: string;
}

export interface StoredFile {
  url: string;
}

export interface FileStorage {
  save(file: StoredFileInput): Promise<StoredFile>;
}

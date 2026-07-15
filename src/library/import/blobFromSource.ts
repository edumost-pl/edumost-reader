import type { BookSource } from "./bookSource";
import { downloadBookZip } from "./downloadBookZip";

/** File | URL → Blob (single entry for import pipeline). */
export async function blobFromSource(source: BookSource): Promise<Blob> {
  if (source.type === "file") {
    return source.file;
  }
  return downloadBookZip(source.url);
}

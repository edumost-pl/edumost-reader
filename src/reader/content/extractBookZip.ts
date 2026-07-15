import JSZip from "jszip";
import { bookContentStore } from "../content/bookContentStore";

function normalizeZipPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

/** Extract EduMost book folder from zip into IndexedDB (keyed by localId). */
export async function extractBookZip(localId: string, blob: Blob): Promise<string> {
  const zip = await JSZip.loadAsync(blob);
  const entries = Object.entries(zip.files).filter(([, e]) => !e.dir);

  const bookTomlCandidates = entries
    .map(([p]) => normalizeZipPath(p))
    .filter((p) => p === "book.toml" || p.endsWith("/book.toml"));

  if (bookTomlCandidates.length === 0) {
    throw new Error("NO_BOOK_TOML");
  }

  bookTomlCandidates.sort((a, b) => a.split("/").length - b.split("/").length);
  const bookTomlPath = bookTomlCandidates[0]!;
  const rootPrefix = bookTomlPath.endsWith("book.toml")
    ? bookTomlPath.slice(0, bookTomlPath.length - "book.toml".length)
    : "";

  const files: Array<{ path: string; data: ArrayBuffer }> = [];
  for (const [rawPath, entry] of entries) {
    const path = normalizeZipPath(rawPath);
    if (!path.startsWith(rootPrefix)) continue;
    const rel = path.slice(rootPrefix.length);
    if (!rel) continue;
    files.push({ path: rel, data: await entry.async("arraybuffer") });
  }

  if (files.length === 0) {
    throw new Error("EMPTY_BOOK");
  }

  await bookContentStore.replaceAll(localId, files);
  return rootPrefix;
}

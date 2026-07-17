import { bookContentStore } from "../content/bookContentStore";

const COVER_CANDIDATES = ["assets/cover.webp", "assets/cover.png"] as const;

function mimeForCoverPath(path: string): string {
  return path.endsWith(".webp") ? "image/webp" : "image/png";
}

/** Resolve book cover: assets/cover.webp → assets/cover.png → null (use default). */
export async function resolveCoverAsset(
  localId: string
): Promise<{ path: string | null; blobUrl: string | null }> {
  for (const path of COVER_CANDIDATES) {
    const bytes = await bookContentStore.getBytes(localId, path);
    if (bytes && bytes.byteLength > 0) {
      const mime = mimeForCoverPath(path);
      const blobUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
      return { path, blobUrl };
    }
  }
  return { path: null, blobUrl: null };
}

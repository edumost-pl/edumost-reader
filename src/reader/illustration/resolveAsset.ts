import { bookContentStore } from "../content/bookContentStore";
import type { IllustrationAsset } from "./types";

/** Order: PNG first, then fallbacks. No manifest. */
const EXT_PRIORITY = ["png", "webp", "jpg", "jpeg", "svg"] as const;

async function tryPath(localId: string, path: string): Promise<ArrayBuffer | null> {
  const bytes = await bookContentStore.getBytes(localId, path);
  if (bytes && bytes.byteLength > 0) return bytes;
  return null;
}

/**
 * Resolve illustration by ID only:
 * assets/illustrations/{ID}.png → .webp → .jpg → .svg
 * relative to book root in IndexedDB.
 */
export async function resolveIllustrationAsset(
  localId: string,
  id: string,
  _locale = "ru"
): Promise<IllustrationAsset> {
  const cleanId = id.trim();
  console.log("Illustration ID:", cleanId);

  const candidates = EXT_PRIORITY.map((ext) => `assets/illustrations/${cleanId}.${ext}`);

  for (const path of candidates) {
    console.log("Trying:", path);
    const bytes = await tryPath(localId, path);
    if (bytes) {
      console.log("Loaded:", path, `(${bytes.byteLength} bytes)`);
      return { id: cleanId, path, alt: cleanId, missing: false };
    }
  }

  // Fallback: scan folder for matching filename (handles odd zip prefixes)
  const available = await bookContentStore.listPaths(localId, "assets/illustrations/");
  const illFiles = available.filter((p) => !p.endsWith("/") && !p.endsWith("manifest.json"));

  for (const ext of EXT_PRIORITY) {
    const needle = `${cleanId}.${ext}`.toLowerCase();
    const hit = illFiles.find((p) => p.replace(/\\/g, "/").toLowerCase().endsWith(needle));
    if (hit) {
      console.log("Trying (scan):", hit);
      const bytes = await tryPath(localId, hit);
      if (bytes) {
        console.log("Loaded:", hit, `(${bytes.byteLength} bytes)`);
        return { id: cleanId, path: hit, alt: cleanId, missing: false };
      }
    }
  }

  console.log("Not found:", cleanId);
  console.log(
    "Available under assets/illustrations/:",
    illFiles.filter((p) => /ILL-/i.test(p))
  );

  return { id: cleanId, path: null, alt: cleanId, missing: true };
}

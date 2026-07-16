import { bookContentStore } from "../content/bookContentStore";
import type { IllustrationAsset } from "./types";

const MANIFEST_PATHS = [
  "assets/illustrations/manifest.json",
  "assets/shared/illustrations/manifest.json",
];

const EXT_PRIORITY = ["webp", "png", "jpg", "jpeg", "svg"] as const;

type ManifestEntry = { file?: string; alt?: string | Record<string, string> };
type Manifest = Record<string, ManifestEntry>;

async function loadManifest(localId: string): Promise<Manifest | null> {
  for (const path of MANIFEST_PATHS) {
    const raw = await bookContentStore.getText(localId, path);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as Manifest;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function altFromEntry(entry: ManifestEntry | undefined, locale: string): string {
  if (!entry?.alt) return "";
  if (typeof entry.alt === "string") return entry.alt;
  return entry.alt[locale] ?? entry.alt.ru ?? entry.alt.en ?? Object.values(entry.alt)[0] ?? "";
}

/** Resolve illustration file path inside the book (IndexedDB). */
export async function resolveIllustrationAsset(
  localId: string,
  id: string,
  locale = "ru"
): Promise<IllustrationAsset> {
  const manifest = await loadManifest(localId);
  const entry = manifest?.[id];
  const alt = altFromEntry(entry, locale) || id;

  const candidates: string[] = [];
  if (entry?.file) {
    candidates.push(
      entry.file.startsWith("assets/")
        ? entry.file
        : `assets/illustrations/${entry.file}`
    );
  }
  for (const ext of EXT_PRIORITY) {
    candidates.push(`assets/illustrations/${id}.${ext}`);
  }

  const seen = new Set<string>();
  for (const path of candidates) {
    const norm = path.replace(/\\/g, "/");
    if (seen.has(norm)) continue;
    seen.add(norm);
    const bytes = await bookContentStore.getBytes(localId, norm);
    if (bytes && bytes.byteLength > 0) {
      return { id, path: norm, alt, missing: false };
    }
  }

  return { id, path: null, alt, missing: true };
}

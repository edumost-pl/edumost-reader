import { loadManifest } from "../../reader/book/buildToc";
import { contentDirForVolume } from "../../reader/book/parseBookToml";
import { bookContentStore } from "../../reader/content/bookContentStore";
import { ImportError } from "./importErrors";

export type ValidationPhase = "structure" | "languages" | "illustrations";

/** Reader-side checks after ZIP extraction (lightweight Book Doctor). */
export async function validateBookContent(
  localId: string,
  onPhase?: (phase: ValidationPhase) => void
): Promise<void> {
  onPhase?.("structure");

  const paths = await bookContentStore.listPaths(localId);
  if (!paths.includes("book.toml")) {
    throw new ImportError("NO_BOOK_TOML");
  }

  const manifest = await loadManifest(localId);
  if (manifest.volumes.length === 0) {
    throw new ImportError("INVALID_BOOK");
  }

  const locale = manifest.defaultLocale;
  let pageCount = 0;
  for (const volume of manifest.volumes) {
    const contentDir = contentDirForVolume(manifest, volume, locale);
    const prefix = `${contentDir}/`;
    pageCount += paths.filter(
      (p) => p.startsWith(prefix) && p.endsWith(".md") && !/\/readme/i.test(p)
    ).length;
  }

  if (pageCount === 0) {
    throw new ImportError("NO_PAGES");
  }

  onPhase?.("languages");

  if (!manifest.supportedLocales?.length) {
    throw new ImportError("INVALID_LOCALES");
  }

  const hasI18n = paths.some((p) => p.startsWith("i18n/") && p.endsWith(".json"));
  if (!hasI18n && manifest.supportedLocales.length > 1) {
    // Non-blocking: metadata overlays are optional at import time
  }

  onPhase?.("illustrations");

  const hasManifest =
    paths.includes("assets/illustrations/manifest.json") ||
    paths.includes("assets/shared/illustrations/manifest.json");
  if (!hasManifest) {
    // Illustrations are optional — Publisher may use placeholders
  }
}

import { bookContentStore } from "../content/bookContentStore";
import type { StoredBook } from "../../library/types";
import { contentDirForVolume } from "./parseBookToml";
import type { BookManifest, TocVolume } from "../types";

/** Locales declared in metadata/library.json (or book.toml) that have content on disk. */
export async function getAvailableLocales(
  localId: string,
  stored: StoredBook,
  manifest: BookManifest
): Promise<string[]> {
  const declared = stored.locales?.length ? stored.locales : manifest.supportedLocales;
  const paths = await bookContentStore.listPaths(localId);

  return declared.filter((loc) =>
    manifest.volumes.some((vol) => {
      const contentDir = contentDirForVolume(manifest, vol, loc);
      return paths.some((p) => p.startsWith(`${contentDir}/`) && /\.md$/i.test(p));
    })
  );
}

export function mapPagePathToLocale(pagePath: string, fromLocale: string, toLocale: string): string {
  const prefix = `${fromLocale}/`;
  if (pagePath.startsWith(prefix)) {
    return `${toLocale}/${pagePath.slice(prefix.length)}`;
  }
  return pagePath;
}

/** Find the best matching page path after a locale switch. */
export async function resolvePageInLocale(
  localId: string,
  toc: TocVolume[],
  currentPath: string,
  fromLocale: string,
  toLocale: string
): Promise<string | null> {
  const mapped = mapPagePathToLocale(currentPath, fromLocale, toLocale);
  const mappedBytes = await bookContentStore.getBytes(localId, mapped);
  if (mappedBytes && mappedBytes.byteLength > 0) return mapped;

  const fileName = currentPath.split("/").pop();
  if (fileName) {
    for (const vol of toc) {
      const hit = vol.pages.find((p) => p.fileName === fileName);
      if (hit) {
        const bytes = await bookContentStore.getBytes(localId, hit.path);
        if (bytes && bytes.byteLength > 0) return hit.path;
      }
    }
  }

  for (const vol of toc) {
    if (vol.pages[0]) return vol.pages[0].path;
  }
  return null;
}

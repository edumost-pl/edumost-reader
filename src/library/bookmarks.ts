import type { StoredBook } from "./types";
import { libraryStore } from "./storage/localLibraryStore";
import { isCloudSourceUrl } from "./import/bookSource";
import { notifyLibraryChanged } from "./context/LibraryProvider";

/** Portable library entry — cloud link + card metadata (no ZIP). */
export interface LibraryBookmark {
  id: string;
  title: string;
  sourceUrl: string;
  subtitle?: string;
  series?: string;
  edition?: string;
  author?: string;
  description?: string;
  locales?: string[];
  defaultLocale?: string;
  theme?: string;
}

export interface LibraryExportFile {
  version: 1;
  exportedAt: string;
  books: LibraryBookmark[];
}

/** Export cloud-linked books so the library can be restored on another device. */
export function exportLibraryBookmarks(books: StoredBook[]): LibraryExportFile {
  const cloudBooks = books.filter((b) => isCloudSourceUrl(b.sourceUrl));
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: cloudBooks.map((b) => ({
      id: b.id,
      title: b.title,
      sourceUrl: b.sourceUrl,
      subtitle: b.subtitle,
      series: b.series,
      edition: b.edition,
      author: b.author,
      description: b.description,
      locales: b.locales,
      defaultLocale: b.defaultLocale,
      theme: b.theme,
    })),
  };
}

/**
 * Import bookmarks into the local library (cards only).
 * Content is downloaded on first open via sourceUrl.
 */
export function importLibraryBookmarks(data: LibraryExportFile): number {
  if (!data || data.version !== 1 || !Array.isArray(data.books)) {
    throw new Error("INVALID_BOOKMARKS");
  }

  let added = 0;
  for (const entry of data.books) {
    if (!entry.id || !entry.title || !isCloudSourceUrl(entry.sourceUrl)) continue;

    const existing = libraryStore.findByBookId(entry.id);
    const localId = existing?.localId ?? crypto.randomUUID();

    const book: StoredBook = {
      localId,
      id: entry.id,
      title: entry.title,
      subtitle: entry.subtitle,
      series: entry.series,
      edition: entry.edition,
      author: entry.author,
      description: entry.description,
      locales: entry.locales ?? ["ru"],
      defaultLocale: entry.defaultLocale ?? "ru",
      theme: entry.theme ?? "edumost-explorer",
      cover: undefined,
      importedAt: existing?.importedAt ?? new Date().toISOString(),
      sourceUrl: entry.sourceUrl.trim(),
    };

    libraryStore.save(book);
    added += 1;
  }

  if (added > 0) notifyLibraryChanged();
  return added;
}

export function downloadBookmarksJson(books: StoredBook[]): void {
  const payload = exportLibraryBookmarks(books);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edumost-library-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

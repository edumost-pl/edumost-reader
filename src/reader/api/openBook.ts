import { libraryStore } from "../../library/storage/localLibraryStore";
import type { StoredBook } from "../../library/types";
import { ensureBookContent } from "../../library/import/ensureBookContent";
import { importErrorMessage } from "../../library/import/importErrors";
import { bookContentStore } from "../content/bookContentStore";
import {
  buildBookToc,
  findVolumeForPage,
  loadManifest,
  loadPageMarkdown,
} from "../book/buildToc";
import { contentDirForVolume } from "../book/parseBookToml";
import { firstPagePath } from "../book/discoverPages";
import { buildIllustrationRegistry } from "../illustration/buildRegistry";
import type { BookManifest, BookReadingSession, ReadingPage, VolumeConfig } from "../types";

export type OpenBookErrorCode =
  | "NOT_FOUND"
  | "NO_CONTENT"
  | "INVALID_BOOK"
  | "NO_PAGES"
  | "RESTORE_FAILED";

export class OpenBookError extends Error {
  constructor(
    readonly code: OpenBookErrorCode,
    message: string
  ) {
    super(message);
    this.name = "OpenBookError";
  }
}

export interface OpenBookResult {
  session: BookReadingSession;
  page: ReadingPage;
  /** Content was re-downloaded from sourceUrl. */
  restored?: boolean;
}

async function loadLibraryCard(localId: string): Promise<Partial<StoredBook>> {
  const raw = await bookContentStore.getText(localId, "metadata/library.json");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<StoredBook>;
  } catch {
    return {};
  }
}

async function assertBookAccess(localId: string): Promise<{ stored: StoredBook; restored: boolean }> {
  const stored = libraryStore.get(localId);
  if (!stored) {
    throw new OpenBookError("NOT_FOUND", "Книга не найдена в библиотеке");
  }

  try {
    const status = await ensureBookContent(stored);
    return { stored, restored: status === "restored" };
  } catch (err) {
    throw new OpenBookError("RESTORE_FAILED", importErrorMessage(err));
  }
}

function firstPageInBook(manifest: BookManifest, localId: string, locale: string): Promise<string | null> {
  return bookContentStore.listPaths(localId).then((allPaths) => {
    for (const volume of manifest.volumes) {
      const contentDir = contentDirForVolume(manifest, volume, locale);
      const page = firstPagePath(allPaths.filter((p) => p.startsWith(`${contentDir}/`)));
      if (page) return page.path;
    }
    return null;
  });
}

/** Open book session + optional page (defaults to first page). Restores from sourceUrl if needed. */
export async function openBook(localId: string, pagePath?: string): Promise<OpenBookResult> {
  const { stored, restored } = await assertBookAccess(localId);
  const manifest = await loadManifest(localId);
  const locale = manifest.defaultLocale;

  if (manifest.volumes.length === 0) {
    throw new OpenBookError("INVALID_BOOK", "В книге нет томов");
  }

  const toc = await buildBookToc(localId, manifest, locale);
  const registry = await buildIllustrationRegistry(localId);
  const session: BookReadingSession = {
    stored,
    manifest,
    locale,
    toc,
    illustrations: registry.items,
    missingIllustrations: registry.missingIds,
  };

  const targetPath = pagePath ?? (await firstPageInBook(manifest, localId, locale));
  if (!targetPath) {
    throw new OpenBookError("NO_PAGES", "В книге нет страниц для чтения");
  }

  const page = await loadReadingPage(localId, session, targetPath);
  return { session, page, restored };
}

/** @deprecated use openBook */
export async function openBookFirstPage(localId: string): Promise<{
  stored: StoredBook;
  manifest: BookManifest;
  volume: VolumeConfig;
  page: ReadingPage;
  pageTitle: string;
}> {
  const { session, page } = await openBook(localId);
  return {
    stored: session.stored,
    manifest: session.manifest,
    volume: page.volume,
    page,
    pageTitle: page.pageLabel,
  };
}

/** Load a page by path without reloading the session. */
export async function loadReadingPage(
  localId: string,
  session: BookReadingSession,
  pagePath: string
): Promise<ReadingPage> {
  const volume = findVolumeForPage(session.manifest, pagePath, session.locale);
  if (!volume) {
    throw new OpenBookError("NO_PAGES", "Страница не найдена в этой книге");
  }

  const { page, markdown, label } = await loadPageMarkdown(localId, pagePath);

  return {
    manifest: session.manifest,
    volume,
    page,
    markdown,
    locale: session.locale,
    pageLabel: label,
  };
}

/** Build StoredBook card fields from extracted book.toml (+ optional library.json). */
export async function metadataFromStoredBook(localId: string): Promise<Partial<StoredBook>> {
  const manifest = await loadManifest(localId);
  const card = await loadLibraryCard(localId);
  return {
    id: manifest.id,
    title: card.title ?? manifest.title,
    subtitle: card.subtitle ?? manifest.subtitle,
    series: card.series ?? manifest.series,
    edition: card.edition ?? manifest.edition,
    author: card.author ?? manifest.author,
    description: card.description,
    locales: card.locales ?? manifest.supportedLocales,
    defaultLocale: card.defaultLocale ?? manifest.defaultLocale,
    theme: card.theme ?? manifest.theme,
    cover: card.cover,
  };
}

export { loadLibraryCard };

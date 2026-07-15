import type { StoredBook } from "../types";
import type { BookSource } from "./bookSource";
import { toStoredSourceRef } from "./bookSource";
import { blobFromSource } from "./blobFromSource";
import { libraryStore } from "../storage/localLibraryStore";
import { metadataFromStoredBook } from "../../reader/api/openBook";
import { bookContentStore } from "../../reader/content/bookContentStore";
import { IMPORT_STEPS } from "./steps";
import { processBookArchive } from "./processBookArchive";
import type { ValidationPhase } from "./validateBookContent";
import { ImportError } from "./importErrors";

function sourceInflightKey(source: BookSource): string {
  if (source.type === "link") return source.url.trim();
  return `file:${source.file.name}:${source.file.size}:${source.file.lastModified}`;
}

function defaultMetaFields(): Omit<
  StoredBook,
  "localId" | "importedAt" | "sourceUrl" | "id" | "title" | "defaultLocale" | "locales" | "theme"
> {
  return {
    subtitle: undefined,
    series: undefined,
    edition: undefined,
    author: undefined,
    description: undefined,
    cover: undefined,
  };
}

async function moveContent(fromId: string, toId: string): Promise<void> {
  const paths = await bookContentStore.listPaths(fromId);
  const files = await Promise.all(
    paths.map(async (path) => ({
      path,
      data: (await bookContentStore.getBytes(fromId, path))!,
    }))
  );
  await bookContentStore.replaceAll(toId, files);
  await bookContentStore.removeAll(fromId);
}

export type ImportProgressCallback = (stepIndex: number) => void;

const PHASE_TO_STEP: Record<ValidationPhase, number> = {
  structure: 1,
  languages: 2,
  illustrations: 3,
};

/**
 * Cloud library import: link or file → fetch/read Blob → processBookArchive → IndexedDB → Library.
 * ZIP is never stored; only extracted book files and sourceUrl remain on device.
 */
export async function importBook(
  source: BookSource,
  onStep: ImportProgressCallback
): Promise<StoredBook> {
  const inflightKey = sourceInflightKey(source);
  const inflight = importInflight.get(inflightKey);
  if (inflight) return inflight;

  const promise = (async () => {
    onStep(0);
    const blob = await blobFromSource(source);

    const contentLocalId = crypto.randomUUID();

    await processBookArchive(contentLocalId, blob, (phase) => {
      onStep(PHASE_TO_STEP[phase]);
    });

    onStep(4);
    const fromBook = await metadataFromStoredBook(contentLocalId);
    if (!fromBook.id || !fromBook.title) {
      throw new ImportError("INVALID_BOOK");
    }

    const meta: Omit<StoredBook, "localId" | "importedAt" | "sourceUrl"> = {
      ...defaultMetaFields(),
      id: fromBook.id,
      title: fromBook.title,
      subtitle: fromBook.subtitle,
      series: fromBook.series,
      edition: fromBook.edition,
      author: fromBook.author,
      description: fromBook.description,
      locales: fromBook.locales ?? ["ru"],
      defaultLocale: fromBook.defaultLocale ?? "ru",
      theme: fromBook.theme ?? "edumost-explorer",
      cover: fromBook.cover,
    };

    const existing = libraryStore.findByBookId(meta.id);
    const targetLocalId = existing?.localId ?? contentLocalId;

    if (targetLocalId !== contentLocalId) {
      await moveContent(contentLocalId, targetLocalId);
    }

    onStep(5);

    const book: StoredBook = {
      ...meta,
      localId: targetLocalId,
      importedAt: new Date().toISOString(),
      sourceUrl: toStoredSourceRef(source),
    };

    libraryStore.save(book);
    return book;
  })();

  importInflight.set(inflightKey, promise);
  try {
    return await promise;
  } finally {
    importInflight.delete(inflightKey);
  }
}

/** Import a book published on GitHub (edumost-books releases). */
export function importBookFromUrl(
  url: string,
  onStep: ImportProgressCallback
): Promise<StoredBook> {
  return importBook({ type: "link", url }, onStep);
}

const importInflight = new Map<string, Promise<StoredBook>>();

export { IMPORT_STEPS };

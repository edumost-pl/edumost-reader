import type { StoredBook } from "../types";
import type { BookSource } from "./bookSource";
import { toStoredSourceRef } from "./bookSource";
import { blobFromSource } from "./blobFromSource";
import { libraryStore } from "../storage/localLibraryStore";
import { extractBookZip } from "../../reader/content/extractBookZip";
import { metadataFromStoredBook } from "../../reader/api/openBook";
import { bookContentStore } from "../../reader/content/bookContentStore";
import { IMPORT_STEPS, STEP_DELAY_MS, delay } from "./steps";

function sourceInflightKey(source: BookSource): string {
  if (source.type === "link") return source.url;
  return `file:${source.file.name}:${source.file.size}:${source.file.lastModified}`;
}

function defaultMetaFields(): Omit<StoredBook, "localId" | "importedAt" | "sourceUrl" | "id" | "title" | "defaultLocale" | "locales" | "theme"> {
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

/**
 * Import pipeline: File | URL → Blob → extractBookZip → IndexedDB → Library
 */
export async function runDemoImport(
  source: BookSource,
  onStep: ImportProgressCallback
): Promise<StoredBook> {
  const inflightKey = sourceInflightKey(source);
  const inflight = importInflight.get(inflightKey);
  if (inflight) return inflight;

  const promise = (async () => {
    const sourceRef = toStoredSourceRef(source);
    const contentLocalId = crypto.randomUUID();

    const blob = await blobFromSource(source);
    if (blob.size === 0) throw new Error("EMPTY_FILE");
    await extractBookZip(contentLocalId, blob);

    for (let i = 0; i < IMPORT_STEPS.length; i++) {
      onStep(i);
      await delay(STEP_DELAY_MS);
    }

    const fromBook = await metadataFromStoredBook(contentLocalId);
    if (!fromBook.id || !fromBook.title) {
      throw new Error("INVALID_BOOK");
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

    const book: StoredBook = {
      ...meta,
      localId: targetLocalId,
      importedAt: new Date().toISOString(),
      sourceUrl: sourceRef,
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

const importInflight = new Map<string, Promise<StoredBook>>();

export { IMPORT_STEPS };

import type { LocalBookId, StoredBook } from "../types";
import { bookKey, INDEX_KEY } from "./keys";

export interface LocalLibraryStore {
  list(): StoredBook[];
  get(localId: LocalBookId): StoredBook | null;
  save(book: StoredBook): void;
  remove(localId: LocalBookId): void;
  findByBookId(bookId: string): StoredBook | null;
}

function readIndex(): LocalBookId[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalBookId[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: LocalBookId[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

/**
 * Browser localStorage store — one JSON record per book.
 * Future: move binary assets (pages, images) to IndexedDB under the same localId.
 */
export class LocalStorageLibraryStore implements LocalLibraryStore {
  list(): StoredBook[] {
    return readIndex()
      .map((id) => this.get(id))
      .filter((b): b is StoredBook => b !== null)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }

  get(localId: LocalBookId): StoredBook | null {
    try {
      const raw = localStorage.getItem(bookKey(localId));
      if (!raw) return null;
      return JSON.parse(raw) as StoredBook;
    } catch {
      return null;
    }
  }

  save(book: StoredBook): void {
    localStorage.setItem(bookKey(book.localId), JSON.stringify(book));
    const ids = readIndex();
    if (!ids.includes(book.localId)) {
      writeIndex([book.localId, ...ids]);
    }
  }

  remove(localId: LocalBookId): void {
    localStorage.removeItem(bookKey(localId));
    writeIndex(readIndex().filter((id) => id !== localId));
  }

  findByBookId(bookId: string): StoredBook | null {
    return this.list().find((b) => b.id === bookId) ?? null;
  }
}

export const libraryStore = new LocalStorageLibraryStore();

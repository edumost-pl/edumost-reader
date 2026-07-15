import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { StoredBook } from "../types";
import { libraryStore } from "../storage/localLibraryStore";

interface LibraryContextValue {
  books: StoredBook[];
  refresh: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

let listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  listeners.forEach((l) => l());
}

let cachedSnapshot: StoredBook[] = [];
let cachedSnapshotKey = "";

function snapshotKey(books: StoredBook[]): string {
  return books.map((b) => `${b.localId}:${b.importedAt}`).join("|");
}

/** Must return a stable reference while underlying data is unchanged (useSyncExternalStore contract). */
function getSnapshot(): StoredBook[] {
  const next = libraryStore.list();
  const key = snapshotKey(next);
  if (key !== cachedSnapshotKey) {
    cachedSnapshotKey = key;
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const books = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(() => {
    emitChange();
  }, []);

  const value = useMemo(() => ({ books, refresh }), [books, refresh]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }
  return ctx;
}

/** Notify UI after a book was saved outside React state. */
export function notifyLibraryChanged(): void {
  emitChange();
}

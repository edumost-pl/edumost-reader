import { bookContentStore } from "../reader/content/bookContentStore";
import { notifyLibraryChanged } from "./context/LibraryProvider";
import { libraryStore } from "./storage/localLibraryStore";
import type { LocalBookId } from "./types";

/** Fully remove a book: IndexedDB content + localStorage record + library index. */
export async function removeBookFromLibrary(localId: LocalBookId): Promise<void> {
  await bookContentStore.removeAll(localId);
  libraryStore.remove(localId);
  notifyLibraryChanged();
}

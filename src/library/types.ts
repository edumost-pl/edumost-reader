import type { LibraryBook } from "../types/library";

/** Unique id for a book copy stored on this device. */
export type LocalBookId = string;

/**
 * A book saved in the Reader's local library.
 * Each import creates its own record — independent of the original link.
 */
export interface StoredBook extends LibraryBook {
  localId: LocalBookId;
  importedAt: string;
  /** Cloud source URL (GitHub link) or dev file ref — never shown in UI. */
  sourceUrl: string;
}

export type ImportStepId =
  | "download"
  | "structure"
  | "languages"
  | "illustrations"
  | "card"
  | "library";

export interface ImportStep {
  id: ImportStepId;
  label: string;
}

export type ImportStepStatus = "pending" | "active" | "done";

export interface ImportProgress {
  steps: ImportStep[];
  currentIndex: number;
  status: "running" | "success" | "error";
  book: StoredBook | null;
}

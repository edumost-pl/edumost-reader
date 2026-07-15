import { extractBookZip } from "../../reader/content/extractBookZip";
import { validateBookContent, type ValidationPhase } from "./validateBookContent";
import { ImportError } from "./importErrors";

/**
 * Unified archive handler for file and URL import.
 * Extracts book files into IndexedDB; the Blob is not persisted.
 */
export async function processBookArchive(
  localId: string,
  blob: Blob,
  onPhase?: (phase: ValidationPhase) => void
): Promise<void> {
  if (blob.size === 0) {
    throw new ImportError("EMPTY_FILE");
  }

  try {
    await extractBookZip(localId, blob);
  } catch (err) {
    if (err instanceof Error && err.message in { NO_BOOK_TOML: 1, EMPTY_BOOK: 1 }) {
      throw new ImportError(err.message as "NO_BOOK_TOML" | "EMPTY_BOOK");
    }
    throw err;
  }

  await validateBookContent(localId, onPhase);
}

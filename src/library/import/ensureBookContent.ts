import { bookContentStore } from "../../reader/content/bookContentStore";
import { processBookArchive } from "./processBookArchive";
import { downloadBookZip } from "./downloadBookZip";
import { isCloudSourceUrl } from "./bookSource";
import { ImportError } from "./importErrors";
import type { StoredBook } from "../types";

/**
 * Ensure book files are in IndexedDB.
 * If missing and sourceUrl is a cloud link — re-download from GitHub (ZIP not stored).
 */
export async function ensureBookContent(book: StoredBook): Promise<"ready" | "restored"> {
  const hasContent = await bookContentStore.has(book.localId);
  if (hasContent) return "ready";

  if (!isCloudSourceUrl(book.sourceUrl)) {
    throw new ImportError("NO_CLOUD_SOURCE");
  }

  const blob = await downloadBookZip(book.sourceUrl);
  await processBookArchive(book.localId, blob);
  return "restored";
}

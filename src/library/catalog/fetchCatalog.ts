import { CLOUD_CATALOG_URL } from "../../lib/constants";
import { resolveGitHubRawUrl } from "../import/resolveBookZipUrl";
import type { CloudCatalog } from "./types";
import { ImportError } from "../import/importErrors";

/** Fetch catalog.json from the cloud books repository. No UI in v1. */
export async function fetchCloudCatalog(
  catalogUrl: string = CLOUD_CATALOG_URL
): Promise<CloudCatalog> {
  let url: string;
  try {
    url = resolveGitHubRawUrl(catalogUrl);
  } catch {
    throw new ImportError("INVALID_URL");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new ImportError("DOWNLOAD_FAILED");
  }

  const data = (await response.json()) as CloudCatalog;
  if (!data?.version || !Array.isArray(data.books)) {
    throw new ImportError("INVALID_BOOK");
  }

  return data;
}

/** Resolve a catalog entry release URL for importBookFromUrl. */
export function catalogReleaseUrl(entry: { releaseUrl: string }): string {
  return entry.releaseUrl.trim();
}

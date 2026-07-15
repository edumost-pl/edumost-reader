/**
 * Convert a GitHub web URL to raw.githubusercontent.com for direct file download.
 * Supports blob links; raw URLs pass through unchanged.
 */
export function resolveBookZipUrl(input: string): string {
  const trimmed = input.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("INVALID_URL");
  }

  if (parsed.hostname === "raw.githubusercontent.com") {
    return parsed.toString();
  }

  if (parsed.hostname === "github.com") {
    const blobMatch = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (blobMatch) {
      const [, owner, repo, branch, filePath] = blobMatch;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    }
  }

  return parsed.toString();
}

export function isZipUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return path.endsWith(".zip") || path.endsWith(".edubook");
}

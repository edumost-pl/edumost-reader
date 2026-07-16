/**
 * Local illustration blob cache (Cache API).
 * Keyed by bookId + asset path + content hash (size) so updates replace old files.
 */

const CACHE_NAME = "edumost-ill-v1";

function cacheKey(bookId: string, path: string, version: string): string {
  const u = new URL("https://edumost.local/ill");
  u.searchParams.set("book", bookId);
  u.searchParams.set("path", path);
  u.searchParams.set("v", version);
  return u.toString();
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function getCachedIllustrationUrl(
  bookId: string,
  path: string,
  version: string
): Promise<string | null> {
  const cache = await openCache();
  if (!cache) return null;
  const res = await cache.match(cacheKey(bookId, path, version));
  if (!res) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function putIllustrationCache(
  bookId: string,
  path: string,
  version: string,
  bytes: ArrayBuffer,
  mime: string
): Promise<string> {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const cache = await openCache();
  if (cache) {
    const keys = await cache.keys();
    await Promise.all(
      keys
        .filter((req) => {
          try {
            const u = new URL(req.url);
            return (
              u.hostname === "edumost.local" &&
              u.searchParams.get("book") === bookId &&
              u.searchParams.get("path") === path &&
              u.searchParams.get("v") !== version
            );
          } catch {
            return false;
          }
        })
        .map((req) => cache.delete(req))
    );
    await cache.put(
      cacheKey(bookId, path, version),
      new Response(blob.slice(), { headers: { "Content-Type": mime } })
    );
  }
  return url;
}

export function mimeForIllustrationPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "svg") return "image/svg+xml";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

/** Version token from byte length — changes when the asset file is replaced. */
export function illustrationVersion(bytes: ArrayBuffer): string {
  return String(bytes.byteLength);
}

import { isZipUrl, resolveGitHubRawUrl } from "./resolveBookZipUrl";
import { ImportError } from "./importErrors";

const ZIP_MAGIC = [0x50, 0x4b]; // PK

async function assertZipBlob(blob: Blob): Promise<void> {
  if (blob.size < 4) throw new ImportError("NOT_ZIP");
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (head[0] !== ZIP_MAGIC[0] || head[1] !== ZIP_MAGIC[1]) {
    throw new ImportError("NOT_ZIP");
  }
}

/** Download book archive from a public URL (GitHub blob → raw, fetch). */
export async function downloadBookZip(inputUrl: string): Promise<Blob> {
  let url: string;
  try {
    url = resolveGitHubRawUrl(inputUrl);
  } catch {
    throw new ImportError("INVALID_URL");
  }

  if (!isZipUrl(url)) {
    throw new ImportError("NOT_ZIP_URL");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new ImportError("DOWNLOAD_FAILED");
  }

  const blob = await response.blob();
  await assertZipBlob(blob);
  return blob;
}

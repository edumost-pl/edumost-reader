import { isZipUrl, resolveBookZipUrl } from "./resolveBookZipUrl";

const ZIP_MAGIC = [0x50, 0x4b]; // PK

async function assertZipBlob(blob: Blob): Promise<void> {
  if (blob.size < 4) throw new Error("NOT_ZIP");
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (head[0] !== ZIP_MAGIC[0] || head[1] !== ZIP_MAGIC[1]) {
    throw new Error("NOT_ZIP");
  }
}

/** Download book archive from a public URL (GitHub blob/raw supported). */
export async function downloadBookZip(inputUrl: string): Promise<Blob> {
  const url = resolveBookZipUrl(inputUrl);

  if (!isZipUrl(url)) {
    throw new Error("NOT_ZIP_URL");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("DOWNLOAD_FAILED");
  }

  const blob = await response.blob();
  await assertZipBlob(blob);
  return blob;
}

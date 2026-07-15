import type { BookManifest, PageRef, TocPage, TocVolume, VolumeConfig } from "../types";
import { bookContentStore } from "../content/bookContentStore";
import { contentDirForVolume, parseBookToml } from "./parseBookToml";
import { parseVolumeMetaToml } from "./parseVolumeMeta";
import { inferPageNumber, pageTitleFromMarkdown, sortPagePaths, toPageRef } from "./discoverPages";

function labLabelFromMarkdown(markdown: string, fileName: string): string {
  for (const line of markdown.split("\n")) {
    const h2 = line.match(/^##\s+(.+)/);
    if (!h2) continue;
    const text = h2[1].replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
    const lab = text.match(/Лаборатория\s*№\s*(\d+)\s*[—–-]\s*(.+)$/i);
    if (lab) {
      return `Лаборатория №${lab[1]} — ${lab[2].trim()}`;
    }
    const tomLab = text.match(/Том\s*\d+\s*·\s*Лаборатория\s*№\s*(\d+)\s*[—–-]\s*(.+)$/i);
    if (tomLab) {
      return `Лаборатория №${tomLab[1]} — ${tomLab[2].trim()}`;
    }
  }

  const number = inferPageNumber(fileName);
  const title = pageTitleFromMarkdown(markdown);
  const cleaned = title
    .replace(/^Том\s*\d+\s*·\s*/i, "")
    .replace(/^Лаборатория\s*№\s*\d+\s*[—–-]\s*/i, "")
    .trim();
  return cleaned ? `Лаборатория №${number} — ${cleaned}` : `Лаборатория №${number}`;
}

async function buildVolumeToc(
  localId: string,
  manifest: BookManifest,
  volume: VolumeConfig,
  volumeIndex: number,
  locale: string,
  allPaths: string[]
): Promise<TocVolume> {
  const metaPath = `${locale}/${volume.path}/meta.toml`;
  const metaRaw = await bookContentStore.getText(localId, metaPath);
  if (metaRaw) parseVolumeMetaToml(metaRaw);

  const contentDir = contentDirForVolume(manifest, volume, locale);
  const pagePaths = sortPagePaths(allPaths.filter((p) => p.startsWith(`${contentDir}/`)));

  const pages: TocPage[] = [];
  for (const path of pagePaths) {
    const ref = toPageRef(path);
    const markdown = await bookContentStore.getText(localId, path);
    if (!markdown) continue;
    const number = inferPageNumber(ref.fileName);
    pages.push({
      path: ref.path,
      fileName: ref.fileName,
      number,
      label: labLabelFromMarkdown(markdown, ref.fileName),
    });
  }

  return {
    id: volume.id,
    title: `Том ${volumeIndex + 1}`,
    pages,
  };
}

/** Build table of contents from book.toml, meta.toml, and markdown files. */
export async function buildBookToc(localId: string, manifest: BookManifest, locale?: string): Promise<TocVolume[]> {
  const loc = locale ?? manifest.defaultLocale;
  const allPaths = await bookContentStore.listPaths(localId);

  const volumes: TocVolume[] = [];
  for (let i = 0; i < manifest.volumes.length; i++) {
    volumes.push(await buildVolumeToc(localId, manifest, manifest.volumes[i]!, i, loc, allPaths));
  }
  return volumes;
}

export function findVolumeForPage(manifest: BookManifest, pagePath: string, locale?: string): VolumeConfig | null {
  const loc = locale ?? manifest.defaultLocale;
  for (const volume of manifest.volumes) {
    const dir = contentDirForVolume(manifest, volume, loc);
    if (pagePath.startsWith(`${dir}/`)) return volume;
  }
  return null;
}

export async function loadManifest(localId: string): Promise<BookManifest> {
  const raw = await bookContentStore.getText(localId, "book.toml");
  if (!raw) throw new Error("NO_BOOK_TOML");
  return parseBookToml(raw);
}

export async function loadPageMarkdown(localId: string, pagePath: string): Promise<{ page: PageRef; markdown: string; label: string }> {
  const markdown = await bookContentStore.getText(localId, pagePath);
  if (!markdown) throw new Error("PAGE_NOT_FOUND");
  const page = toPageRef(pagePath);
  return {
    page,
    markdown,
    label: labLabelFromMarkdown(markdown, page.fileName),
  };
}

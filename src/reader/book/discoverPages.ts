import type { PageRef } from "../types";

const MD_PAGE = /\.md$/i;
const SKIP_README = /^readme/i;

export function sortPagePaths(paths: string[]): string[] {
  return [...paths]
    .filter((p) => MD_PAGE.test(p) && !SKIP_README.test(p.split("/").pop() ?? ""))
    .sort((a, b) => {
      const na = a.split("/").pop() ?? a;
      const nb = b.split("/").pop() ?? b;
      return na.localeCompare(nb, undefined, { numeric: true });
    });
}

export function toPageRef(path: string): PageRef {
  const fileName = path.split("/").pop() ?? path;
  return { path, fileName };
}

export function firstPagePath(paths: string[]): PageRef | null {
  const sorted = sortPagePaths(paths);
  return sorted[0] ? toPageRef(sorted[0]) : null;
}

export function inferPageNumber(fileName: string): number {
  const match = fileName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function pageTitleFromMarkdown(markdown: string): string {
  for (const line of markdown.split("\n")) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) return h2[1].replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
    const h1 = line.match(/^#\s+(.+)/);
    if (h1 && !h2) return h1[1].trim();
  }
  return "Страница";
}

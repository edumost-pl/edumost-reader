import { marked } from "marked";
import { bookContentStore } from "../content/bookContentStore";

/** Remove interactive checklist syntax — render as plain list items. */
export function stripInteractiveMarkdown(markdown: string): string {
  return markdown
    .replace(/^- \[ \]\s+/gm, "- ")
    .replace(/^- \[[xX]\]\s+/gm, "- ");
}

function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(0, i) : "";
}

function resolveAssetPath(pagePath: string, href: string): string {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  if (clean.startsWith("/")) return clean.slice(1);
  const base = dirname(pagePath);
  const parts = (base ? `${base}/${clean}` : clean).split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function mimeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "svg") return "image/svg+xml";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

export interface RenderedMarkdown {
  html: string;
  blobUrls: string[];
}

/** Parse Markdown → HTML; resolve local images from stored book files. */
export async function renderMarkdown(
  localId: string,
  pagePath: string,
  markdown: string
): Promise<RenderedMarkdown> {
  const blobUrls: string[] = [];
  let source = stripInteractiveMarkdown(markdown);

  const imageRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const replacements: Array<{ from: string; to: string }> = [];

  for (const match of source.matchAll(imageRe)) {
    const full = match[0];
    const alt = match[1] ?? "";
    const href = match[2] ?? "";
    const resolved = resolveAssetPath(pagePath, href);
    if (!resolved || resolved.startsWith("http")) continue;

    const bytes = await bookContentStore.getBytes(localId, resolved);
    if (!bytes) continue;

    const blob = new Blob([bytes], { type: mimeForPath(resolved) });
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    replacements.push({ from: full, to: `![${alt}](${url})` });
  }

  for (const { from, to } of replacements) {
    source = source.replace(from, to);
  }

  marked.setOptions({ gfm: true, breaks: true });
  const html = await marked.parse(source);
  return { html: typeof html === "string" ? html : "", blobUrls };
}

export function revokeBlobUrls(urls: string[]): void {
  for (const url of urls) URL.revokeObjectURL(url);
}

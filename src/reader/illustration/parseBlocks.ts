import { ILLUSTRATION_ID_RE, type IllustrationParams } from "./types";

const FENCE_RE = /:::illustration\s*\n([\s\S]*?)\n:::/g;

/** Parse a single :::illustration body into id + optional params. */
export function parseIllustrationBody(body: string): IllustrationParams | null {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let id: string | undefined;
  let width: string | undefined;
  let caption: string | undefined;

  for (const line of lines) {
    const idMatch = line.match(ILLUSTRATION_ID_RE);
    if (idMatch && !line.includes("=")) {
      id = idMatch[0];
      continue;
    }
    const widthMatch = line.match(/^width\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))\s*$/i);
    if (widthMatch) {
      width = widthMatch[1] ?? widthMatch[2] ?? widthMatch[3];
      continue;
    }
    const captionMatch = line.match(/^caption\s*=\s*(?:"([^"]*)"|'([^']*)')\s*$/i);
    if (captionMatch) {
      caption = captionMatch[1] ?? captionMatch[2];
      continue;
    }
    // Bare ID on first line without ILL- pattern still accepted if whole line is ID-like
    if (!id && ILLUSTRATION_ID_RE.test(line)) id = line.match(ILLUSTRATION_ID_RE)![0];
  }

  if (!id) return null;
  return { id, width, caption };
}

/** Find all :::illustration blocks in markdown (order preserved). */
export function findIllustrationBlocks(markdown: string): IllustrationParams[] {
  const out: IllustrationParams[] = [];
  for (const match of markdown.matchAll(FENCE_RE)) {
    const parsed = parseIllustrationBody(match[1] ?? "");
    if (parsed) out.push(parsed);
  }
  return out;
}

export type MarkdownSegment =
  | { type: "markdown"; text: string }
  | { type: "illustration"; params: IllustrationParams };

/** Split markdown into text / illustration segments for React rendering. */
export function splitMarkdownWithIllustrations(markdown: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let last = 0;
  const re = new RegExp(FENCE_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    if (m.index > last) {
      segments.push({ type: "markdown", text: markdown.slice(last, m.index) });
    }
    const parsed = parseIllustrationBody(m[1] ?? "");
    if (parsed) {
      segments.push({ type: "illustration", params: parsed });
    } else {
      segments.push({ type: "markdown", text: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < markdown.length) {
    segments.push({ type: "markdown", text: markdown.slice(last) });
  }
  return segments;
}

/** Strip illustration fences (and optionally prompts folder refs) — never show artist text. */
export function stripArtistFacingContent(markdown: string): string {
  return markdown.replace(FENCE_RE, "\n");
}

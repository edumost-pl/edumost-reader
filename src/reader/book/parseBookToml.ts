import type { BookManifest, VolumeConfig } from "../types";

function getQuoted(raw: string, key: string): string | undefined {
  return raw.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, "m"))?.[1];
}

function parseSupportedLocales(raw: string): string[] {
  const match = raw.match(/^supportedLocales\s*=\s*\[([^\]]*)\]/m);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function parseVolumes(raw: string): VolumeConfig[] {
  const volumes: VolumeConfig[] = [];
  const re = /\[\[volumes\]\]\s*\n([\s\S]*?)(?=\n\[\[|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const block = m[1];
    const getVol = (key: string) => block.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, "m"))?.[1];
    volumes.push({
      id: getVol("id") ?? `vol-${volumes.length + 1}`,
      path: getVol("path") ?? "tom-01",
      title: getVol("title") ?? "",
      contentSource: getVol("contentSource"),
    });
  }
  return volumes;
}

export function parseBookToml(raw: string): BookManifest {
  const defaultLocale = getQuoted(raw, "defaultLocale") ?? getQuoted(raw, "sourceLocale") ?? "ru";
  const supportedLocales = parseSupportedLocales(raw);
  return {
    id: getQuoted(raw, "id") ?? "book",
    title: getQuoted(raw, "title") ?? "Book",
    theme: getQuoted(raw, "theme") ?? "edumost-explorer",
    sourceLocale: getQuoted(raw, "sourceLocale") ?? defaultLocale,
    defaultLocale,
    supportedLocales: supportedLocales.length ? supportedLocales : [defaultLocale],
    author: getQuoted(raw, "author"),
    series: getQuoted(raw, "series"),
    edition: getQuoted(raw, "edition"),
    subtitle: getQuoted(raw, "subtitle"),
    volumes: parseVolumes(raw),
  };
}

export function contentDirForVolume(
  manifest: BookManifest,
  volume: VolumeConfig,
  locale?: string
): string {
  const loc = locale ?? manifest.defaultLocale;
  if (volume.contentSource) {
    return volume.contentSource.replace(/\\/g, "/").replace(/^\.\//, "");
  }
  return `${loc}/${volume.path}/content`;
}

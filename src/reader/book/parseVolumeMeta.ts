function getQuoted(raw: string, key: string): string | undefined {
  return raw.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, "m"))?.[1];
}

/** Parse `{locale}/{volume}/meta.toml` */
export function parseVolumeMetaToml(raw: string): { id?: string; title?: string; version?: string; locale?: string } {
  return {
    id: getQuoted(raw, "id"),
    title: getQuoted(raw, "title"),
    version: getQuoted(raw, "version"),
    locale: getQuoted(raw, "locale"),
  };
}

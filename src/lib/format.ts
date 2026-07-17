const LOCALE_LABELS: Record<string, string> = {
  ru: "Русский",
  uk: "Українська",
  pl: "Polski",
  en: "English",
};

export function formatLocale(code: string): string {
  return LOCALE_LABELS[code] ?? code.toUpperCase();
}

export function formatLocales(locales: string[], defaultLocale: string): string {
  const ordered = [defaultLocale, ...locales.filter((l) => l !== defaultLocale)];
  return ordered.map(formatLocale).join(" · ");
}

/** Standard green cover when no assets/cover.webp|png. */
export const DEFAULT_COVER_GRADIENT: [string, string] = ["#2d6a4f", "#40916c"];

/** Deterministic accent from book id for cover gradients. */
export function coverGradient(id: string): [string, string] {
  const palettes: Array<[string, string]> = [
    ["#2d6a4f", "#40916c"],
    ["#264653", "#457b9d"],
    ["#6d597a", "#b56576"],
    ["#bc6c25", "#dda15e"],
    ["#1d3557", "#457b9d"],
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % palettes.length;
  }
  return palettes[hash]!;
}

/** Supported book file extensions. */
export const BOOK_FILE_EXTENSIONS = [".zip", ".edubook"] as const;

export type BookFileExtension = (typeof BOOK_FILE_EXTENSIONS)[number];

export type BookSource =
  | { type: "link"; url: string }
  | { type: "file"; file: File };

/** Serializable source passed through router state (File held separately). */
export type BookSourceState =
  | { type: "link"; url: string }
  | { type: "file"; fileName: string; fileSize: number; fileModified: number };

export function isAllowedBookFile(name: string): boolean {
  const lower = name.toLowerCase();
  return BOOK_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function acceptAttribute(): string {
  return BOOK_FILE_EXTENSIONS.join(",");
}

export function sourceStateKey(source: BookSourceState): string {
  if (source.type === "link") return source.url;
  return `file:${source.fileName}:${source.fileSize}:${source.fileModified}`;
}

export function toSourceState(source: BookSource): BookSourceState {
  if (source.type === "link") {
    return { type: "link", url: source.url };
  }
  return {
    type: "file",
    fileName: source.file.name,
    fileSize: source.file.size,
    fileModified: source.file.lastModified,
  };
}

/** Internal storage reference — original URL for cloud books; never shown in UI. */
export function toStoredSourceRef(source: BookSource): string {
  if (source.type === "link") return source.url.trim();
  return `edumost-file:${source.file.name}`;
}

export function bookSourceFromState(state: BookSourceState, file: File | null): BookSource | null {
  if (state.type === "link") {
    return { type: "link", url: state.url };
  }
  if (!file) return null;
  if (
    file.name !== state.fileName ||
    file.size !== state.fileSize ||
    file.lastModified !== state.fileModified
  ) {
    return null;
  }
  return { type: "file", file };
}

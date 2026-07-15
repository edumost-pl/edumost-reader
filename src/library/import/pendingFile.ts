import type { BookSourceState } from "./bookSource";

/** Holds the selected File between /add and /verify (same browser tab). */
let pending: { state: BookSourceState; file: File } | null = null;

export function stagePendingFile(state: BookSourceState, file: File): void {
  pending = { state, file };
}

export function getPendingFile(state: BookSourceState): File | null {
  if (state.type !== "file") return null;
  if (!pending || pending.state.type !== "file") return null;
  const s = pending.state;
  if (
    s.fileName !== state.fileName ||
    s.fileSize !== state.fileSize ||
    s.fileModified !== state.fileModified
  ) {
    return null;
  }
  return pending.file;
}

export function clearPendingFile(): void {
  pending = null;
}

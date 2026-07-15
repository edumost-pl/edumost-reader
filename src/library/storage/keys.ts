export const STORAGE_VERSION = "v1";
export const INDEX_KEY = `edumost-reader:${STORAGE_VERSION}:index`;
export function bookKey(localId: string): string {
  return `edumost-reader:${STORAGE_VERSION}:book:${localId}`;
}

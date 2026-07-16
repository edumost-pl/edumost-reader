import { bookContentStore } from "../content/bookContentStore";
import { findIllustrationBlocks } from "./parseBlocks";
import { resolveIllustrationAsset } from "./resolveAsset";
import type { IllustrationRef, IllustrationRegistry } from "./types";

/**
 * Scan all markdown pages of a book and build an ordered illustration registry.
 * Used for gallery navigation and missing-asset checks.
 */
export async function buildIllustrationRegistry(localId: string): Promise<IllustrationRegistry> {
  const paths = await bookContentStore.listPaths(localId);
  const mdPaths = paths
    .filter((p) => p.endsWith(".md") && !/\/readme/i.test(p) && !p.startsWith("prompts/"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const items: IllustrationRef[] = [];
  const seen = new Set<string>();

  for (const pagePath of mdPaths) {
    const text = await bookContentStore.getText(localId, pagePath);
    if (!text) continue;
    for (const block of findIllustrationBlocks(text)) {
      // Gallery lists each occurrence; byId keeps first
      const ref: IllustrationRef = {
        ...block,
        pagePath,
        index: items.length,
      };
      items.push(ref);
      if (!seen.has(block.id)) seen.add(block.id);
    }
  }

  const byId = new Map<string, IllustrationRef>();
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }

  const missingIds: string[] = [];
  for (const id of byId.keys()) {
    const asset = await resolveIllustrationAsset(localId, id);
    if (asset.missing) missingIds.push(id);
  }

  return { localId, items, byId, missingIds };
}

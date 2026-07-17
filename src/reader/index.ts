export type * from "./types";
export { parseBookToml, contentDirForVolume } from "./book/parseBookToml";
export { parseVolumeMetaToml } from "./book/parseVolumeMeta";
export { firstPagePath, pageTitleFromMarkdown, sortPagePaths, inferPageNumber } from "./book/discoverPages";
export {
  buildBookToc,
  findVolumeForPage,
  loadManifest,
  loadPageMarkdown,
} from "./book/buildToc";
export { bookContentStore } from "./content/bookContentStore";
export { extractBookZip } from "./content/extractBookZip";
export { renderMarkdown, revokeBlobUrls, stripInteractiveMarkdown } from "./markdown/renderMarkdown";
export { buildIllustrationRegistry } from "./illustration/buildRegistry";
export { findIllustrationBlocks, splitMarkdownWithIllustrations } from "./illustration/parseBlocks";
export { resolveIllustrationAsset } from "./illustration/resolveAsset";
export { resolveCoverAsset } from "./cover/resolveCover";
export { getAvailableLocales, mapPagePathToLocale } from "./book/locale";
export type {
  IllustrationParams,
  IllustrationRef,
  IllustrationRegistry,
  IllustrationAsset,
} from "./illustration/types";
export {
  openBook,
  openBookFirstPage,
  loadReadingPage,
  switchBookLocale,
  metadataFromStoredBook,
  OpenBookError,
  type OpenBookResult,
  type OpenBookOptions,
  type OpenBookErrorCode,
} from "./api/openBook";

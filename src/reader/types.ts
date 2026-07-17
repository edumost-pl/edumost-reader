import type { StoredBook } from "../library/types";

export interface VolumeConfig {
  id: string;
  path: string;
  title: string;
  contentSource?: string;
}

export interface BookManifest {
  id: string;
  title: string;
  theme: string;
  sourceLocale: string;
  defaultLocale: string;
  supportedLocales: string[];
  author?: string;
  series?: string;
  edition?: string;
  subtitle?: string;
  volumes: VolumeConfig[];
}

export interface PageRef {
  /** Path relative to book root, e.g. ru/tom-01/content/00_LAB....md */
  path: string;
  fileName: string;
}

export interface ReadingPage {
  manifest: BookManifest;
  volume: VolumeConfig;
  page: PageRef;
  markdown: string;
  locale: string;
  pageLabel: string;
}

export interface TocPage {
  path: string;
  fileName: string;
  number: number;
  label: string;
}

export interface TocVolume {
  id: string;
  title: string;
  pages: TocPage[];
}

export interface BookReadingSession {
  stored: StoredBook;
  manifest: BookManifest;
  locale: string;
  /** Locales from metadata/library.json that have content folders on disk. */
  availableLocales: string[];
  toc: TocVolume[];
  /** Ordered list of :::illustration blocks across the book */
  illustrations: import("./illustration/types").IllustrationRef[];
  /** IDs referenced in markdown but missing under assets/illustrations/ */
  missingIllustrations: string[];
}

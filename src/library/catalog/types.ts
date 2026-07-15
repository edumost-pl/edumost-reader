/**
 * Cloud catalog contract (catalog.json in edumost-books).
 * UI for browsing the catalog is a future stage — types only for v1.
 */

export interface CloudCatalogBook {
  /** Stable book id (matches book.toml id). */
  id: string;
  title: string;
  subtitle?: string;
  series?: string;
  seriesId?: string;
  seriesOrder?: number;
  edition?: string;
  author?: string;
  description?: string;
  /** GitHub blob or raw URL to releases/*.zip */
  releaseUrl: string;
  locales: string[];
  defaultLocale: string;
  theme: string;
  cover?: string;
}

export interface CloudCatalog {
  version: string;
  updatedAt: string;
  repository: string;
  books: CloudCatalogBook[];
}

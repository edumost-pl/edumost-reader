/** Illustration ID: ILL-T{tome}-L{lab}-{n} */
export const ILLUSTRATION_ID_RE = /ILL-T\d+-L\d+-\d+/;

export interface IllustrationParams {
  id: string;
  width?: string;
  caption?: string;
}

export interface IllustrationRef extends IllustrationParams {
  /** Page path where the block appears */
  pagePath: string;
  /** Order in the book (0-based) */
  index: number;
}

export interface IllustrationAsset {
  id: string;
  /** Book-root path in IndexedDB, or null if missing */
  path: string | null;
  alt: string;
  missing: boolean;
}

export interface IllustrationRegistry {
  localId: string;
  items: IllustrationRef[];
  byId: Map<string, IllustrationRef>;
  missingIds: string[];
}

/** Card metadata from EduMost book release (metadata/library.json). */
export interface LibraryBook {
  id: string;
  title: string;
  subtitle?: string;
  series?: string;
  edition?: string;
  author?: string;
  description?: string;
  locales: string[];
  defaultLocale: string;
  theme: string;
  cover?: string;
}

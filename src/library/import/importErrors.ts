export type ImportErrorCode =
  | "INVALID_URL"
  | "NOT_ZIP_URL"
  | "DOWNLOAD_FAILED"
  | "NOT_ZIP"
  | "EMPTY_FILE"
  | "NO_BOOK_TOML"
  | "EMPTY_BOOK"
  | "NO_PAGES"
  | "INVALID_BOOK"
  | "INVALID_LOCALES";

const MESSAGES: Record<ImportErrorCode, string> = {
  INVALID_URL: "Ссылка недействительна. Проверьте адрес и попробуйте снова.",
  NOT_ZIP_URL: "Ссылка должна вести на файл книги (.zip).",
  DOWNLOAD_FAILED: "Не удалось скачать книгу. Проверьте ссылку и подключение к интернету.",
  NOT_ZIP: "Файл не является архивом книги EduMost.",
  EMPTY_FILE: "Файл пустой.",
  NO_BOOK_TOML: "В архиве нет book.toml — это не книга EduMost.",
  EMPTY_BOOK: "Архив книги пустой.",
  NO_PAGES: "В книге нет лабораторий для чтения.",
  INVALID_BOOK: "Не удалось прочитать данные книги.",
  INVALID_LOCALES: "В книге не указаны языки.",
};

export class ImportError extends Error {
  readonly code: ImportErrorCode;

  constructor(code: ImportErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
    this.name = "ImportError";
    this.code = code;
  }
}

export function importErrorFromUnknown(err: unknown): ImportError {
  if (err instanceof ImportError) return err;
  if (err instanceof Error) {
    const code = err.message as ImportErrorCode;
    if (code in MESSAGES) return new ImportError(code);
  }
  return new ImportError("INVALID_BOOK");
}

export function importErrorMessage(err: unknown): string {
  return importErrorFromUnknown(err).message;
}

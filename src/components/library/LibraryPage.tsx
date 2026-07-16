import { useRef, useState } from "react";
import {
  useLibrary,
  downloadBookmarksJson,
  importLibraryBookmarks,
  isCloudSourceUrl,
  type LibraryExportFile,
} from "../../library";
import { BookGrid } from "./BookGrid";
import { EmptyLibrary } from "./EmptyLibrary";

export function LibraryPage() {
  const { books } = useLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const cloudCount = books.filter((b) => isCloudSourceUrl(b.sourceUrl)).length;

  function handleExport() {
    if (cloudCount === 0) {
      setMessage("Нет книг со ссылкой GitHub для экспорта.");
      return;
    }
    downloadBookmarksJson(books);
    setMessage(`Экспортировано ссылок: ${cloudCount}`);
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as LibraryExportFile;
      const n = importLibraryBookmarks(data);
      setMessage(n > 0 ? `Добавлено в библиотеку: ${n}. Откройте книгу — она скачается с GitHub.` : "Новых книг не найдено.");
    } catch {
      setMessage("Не удалось прочитать файл библиотеки.");
    }
  }

  return (
    <div className="library-page">
      <header className="library-page__header">
        <h1 className="library-page__title">Моя библиотека</h1>
        {books.length > 0 && (
          <p className="library-page__subtitle">
            {books.length === 1
              ? "1 книга"
              : books.length < 5
                ? `${books.length} книги`
                : `${books.length} книг`}
            {cloudCount > 0 && (
              <span className="library-page__cloud-hint"> · ссылки GitHub сохранены</span>
            )}
          </p>
        )}
      </header>

      {books.length > 0 && (
        <div className="library-toolbar">
          <button type="button" className="library-toolbar__btn" onClick={handleExport}>
            Экспорт ссылок
          </button>
          <button
            type="button"
            className="library-toolbar__btn"
            onClick={() => fileRef.current?.click()}
          >
            Импорт ссылок
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handleImportFile(f);
            }}
          />
        </div>
      )}

      {message && (
        <p className="library-page__message" role="status">
          {message}
        </p>
      )}

      {books.length === 0 ? <EmptyLibrary /> : <BookGrid books={books} />}
    </div>
  );
}

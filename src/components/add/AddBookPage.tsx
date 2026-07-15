import { FormEvent, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  acceptAttribute,
  isAllowedBookFile,
  stagePendingFile,
  toSourceState,
} from "../../library";
import { EXAMPLE_BOOK_URL, LINK_PLACEHOLDER } from "../../lib/constants";

export function AddBookPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [showDevImport, setShowDevImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLinkSubmit(e: FormEvent) {
    e.preventDefault();
    setFileError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setFileError("Вставьте ссылку на книгу EduMost на GitHub.");
      return;
    }
    navigate("/verify", { state: { source: { type: "link", url: trimmed } } });
  }

  function openFilePicker() {
    setFileError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isAllowedBookFile(file.name)) {
      setFileError("Этот формат не подходит. Выберите файл книги EduMost (.zip).");
      return;
    }

    const sourceState = toSourceState({ type: "file", file });
    stagePendingFile(sourceState, file);
    navigate("/verify", { state: { source: sourceState } });
  }

  return (
    <div className="flow-page add-book-page">
      <input
        ref={fileInputRef}
        type="file"
        className="visually-hidden"
        accept={acceptAttribute()}
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <header className="flow-page__header">
        <h1 className="flow-page__title">Добавить книгу</h1>
        <p className="flow-page__subtitle">
          Вставьте ссылку на опубликованную книгу — она сохранится на устройстве для чтения офлайн
        </p>
      </header>

      {fileError && (
        <p className="add-book-error" role="alert">
          {fileError}
        </p>
      )}

      <article className="method-card method-card--expanded add-book-primary">
        <div className="method-card__icon" aria-hidden="true">
          ☁️
        </div>
        <h2 className="method-card__title">По ссылке с GitHub</h2>
        <p className="method-card__text">
          Ссылка на release ZIP из репозитория{" "}
          <code>edumost-books</code>. Поддерживаются обычные GitHub-ссылки — Reader скачает файл
          автоматически.
        </p>

        <form className="add-link-form" onSubmit={handleLinkSubmit}>
          <label className="visually-hidden" htmlFor="book-url">
            Ссылка на книгу
          </label>
          <input
            id="book-url"
            type="url"
            className="add-link-form__input"
            placeholder={LINK_PLACEHOLDER}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          <button type="submit" className="add-link-form__submit method-card__action--primary">
            <span aria-hidden="true">➕</span>
            Добавить книгу
          </button>
        </form>

        <p className="add-book-hint">
          Пример:{" "}
          <button
            type="button"
            className="add-book-hint__link"
            onClick={() => setUrl(EXAMPLE_BOOK_URL)}
          >
            Engineering Roadmap · Tom 1
          </button>
        </p>
      </article>

      <div className="add-book-dev">
        <button
          type="button"
          className="add-book-dev__toggle"
          onClick={() => setShowDevImport((v) => !v)}
          aria-expanded={showDevImport}
        >
          {showDevImport ? "Скрыть" : "Для авторов и разработки"} — импорт из файла
        </button>

        {showDevImport && (
          <article className="method-card add-book-dev__panel">
            <div className="method-card__icon" aria-hidden="true">
              📁
            </div>
            <h2 className="method-card__title">Из файла на компьютере</h2>
            <p className="method-card__text">
              Локальный ZIP с <code>book.toml</code> в корне — для тестирования до публикации на
              GitHub.
            </p>
            <button type="button" className="method-card__action" onClick={openFilePicker}>
              Выбрать файл
            </button>
          </article>
        )}
      </div>
    </div>
  );
}

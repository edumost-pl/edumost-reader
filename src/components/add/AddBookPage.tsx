import { FormEvent, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  acceptAttribute,
  isAllowedBookFile,
  stagePendingFile,
  toSourceState,
} from "../../library";
import { LINK_PLACEHOLDER } from "../../lib/constants";

type AddMethod = "choose" | "link";

export function AddBookPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<AddMethod>("choose");
  const [url, setUrl] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLinkSubmit(e: FormEvent) {
    e.preventDefault();
    setFileError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setFileError("Вставьте ссылку на книгу EduMost.");
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
        <p className="flow-page__subtitle">Выберите способ добавления книги</p>
      </header>

      {fileError && (
        <p className="add-book-error" role="alert">
          {fileError}
        </p>
      )}

      {method === "choose" && (
        <div className="add-methods">
          <article className="method-card">
            <div className="method-card__icon" aria-hidden="true">
              🔗
            </div>
            <h2 className="method-card__title">По ссылке</h2>
            <p className="method-card__text">
              Вставьте ссылку на опубликованную книгу EduMost
            </p>
            <button
              type="button"
              className="method-card__action method-card__action--primary"
              onClick={() => setMethod("link")}
            >
              Продолжить
            </button>
          </article>

          <article className="method-card">
            <div className="method-card__icon" aria-hidden="true">
              📁
            </div>
            <h2 className="method-card__title">Из файла</h2>
            <p className="method-card__text">Выберите книгу с компьютера</p>
            <button type="button" className="method-card__action" onClick={openFilePicker}>
              Выбрать файл
            </button>
          </article>
        </div>
      )}

      {method === "link" && (
        <div className="add-link-panel">
          <button
            type="button"
            className="add-link-panel__back"
            onClick={() => setMethod("choose")}
          >
            ← Назад
          </button>

          <article className="method-card method-card--expanded">
            <div className="method-card__icon" aria-hidden="true">
              🔗
            </div>
            <h2 className="method-card__title">По ссылке</h2>
            <p className="method-card__text">
              Вставьте ссылку на опубликованную книгу EduMost
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
              <button type="submit" className="add-link-form__submit">
                <span aria-hidden="true">➕</span>
                Добавить книгу
              </button>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}

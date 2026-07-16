import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StoredBook } from "../../library";
import { isCloudSourceUrl, removeBookFromLibrary } from "../../library";
import { coverGradient, formatLocales } from "../../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";

interface BookCardProps {
  book: StoredBook;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const [colorA, colorB] = coverGradient(book.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fromCloud = isCloudSourceUrl(book.sourceUrl);

  async function handleDeleteConfirm() {
    setRemoving(true);
    try {
      await removeBookFromLibrary(book.localId);
      setConfirmOpen(false);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <article className="book-card" data-theme={book.theme}>
        <div className="book-card__book">
          <div
            className="book-card__cover"
            style={{
              background: `linear-gradient(145deg, ${colorA} 0%, ${colorB} 55%, ${colorA}dd 100%)`,
            }}
          >
            <div className="book-card__cover-shine" aria-hidden="true" />
            <div className="book-card__cover-content">
              {book.series && <span className="book-card__series">{book.series}</span>}
              <h2 className="book-card__cover-title">{book.title}</h2>
              {book.edition && <span className="book-card__edition">{book.edition}</span>}
            </div>
            <div className="book-card__spine" aria-hidden="true" />
            {fromCloud && (
              <span className="book-card__cloud-badge" title="Книга из облака GitHub">
                ☁️
              </span>
            )}
          </div>
        </div>

        <div className="book-card__meta">
          <div className="book-card__meta-head">
            <h3 className="book-card__title">{book.title}</h3>
            <button
              type="button"
              className="book-card__delete"
              aria-label={`Удалить «${book.title}»`}
              onClick={() => setConfirmOpen(true)}
              disabled={removing}
            >
              🗑
            </button>
          </div>

          <dl className="book-card__details">
            {book.edition && (
              <div className="book-card__detail">
                <dt>Том</dt>
                <dd>{book.edition}</dd>
              </div>
            )}
            <div className="book-card__detail">
              <dt>Язык</dt>
              <dd>{formatLocales(book.locales, book.defaultLocale)}</dd>
            </div>
            {book.author && (
              <div className="book-card__detail">
                <dt>Автор</dt>
                <dd>{book.author}</dd>
              </div>
            )}
            {book.series && (
              <div className="book-card__detail">
                <dt>Серия</dt>
                <dd>{book.series}</dd>
              </div>
            )}
            {fromCloud && (
              <div className="book-card__detail">
                <dt>Источник</dt>
                <dd>GitHub · офлайн после открытия</dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            className="book-card__open"
            onClick={() => navigate(`/read/${book.localId}`)}
          >
            Читать книгу
          </button>
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Удалить книгу?"
        message={`«${book.title}» будет удалена с этого устройства. Это действие нельзя отменить.`}
        confirmLabel={removing ? "Удаляем…" : "Удалить"}
        confirmDisabled={removing}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => !removing && setConfirmOpen(false)}
      />
    </>
  );
}

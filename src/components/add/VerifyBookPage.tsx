import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IMPORT_STEPS,
  notifyLibraryChanged,
  importBook,
  importErrorMessage,
  getPendingFile,
  clearPendingFile,
  type BookSource,
  type BookSourceState,
  type StoredBook,
} from "../../library";

interface VerifyLocationState {
  source?: BookSourceState;
  /** @deprecated legacy link flow */
  bookUrl?: string;
}

function resolveSourceState(state: VerifyLocationState | null): BookSourceState | null {
  if (state?.source) return state.source;
  if (state?.bookUrl) return { type: "link", url: state.bookUrl };
  return null;
}

function resolveBookSource(sourceState: BookSourceState): BookSource | null {
  if (sourceState.type === "link") {
    return { type: "link", url: sourceState.url };
  }
  const file = getPendingFile(sourceState);
  if (!file) return null;
  return { type: "file", file };
}

export function VerifyBookPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sourceState = resolveSourceState(location.state as VerifyLocationState | null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [savedBook, setSavedBook] = useState<StoredBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceState) {
      navigate("/add", { replace: true });
      return;
    }

    const bookSource = resolveBookSource(sourceState);
    if (!bookSource) {
      navigate("/add", { replace: true });
      return;
    }

    let cancelled = false;

    importBook(bookSource, (index) => {
      if (!cancelled) setCurrentIndex(index);
    })
      .then((book) => {
        if (cancelled) return;
        clearPendingFile();
        notifyLibraryChanged();
        setSavedBook(book);
        setDone(true);
      })
      .catch((err) => {
        if (!cancelled) setError(importErrorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [sourceState, navigate]);

  if (!sourceState) {
    return null;
  }

  if (error) {
    return (
      <div className="flow-page prepare-page prepare-page--error">
        <div className="success-card">
          <div className="success-card__icon" aria-hidden="true">
            ⚠️
          </div>
          <h1 className="success-card__title">Не удалось добавить книгу</h1>
          <p className="success-card__book">{error}</p>
          <div className="success-card__actions">
            <button type="button" className="success-card__read" onClick={() => navigate("/add")}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done && savedBook) {
    return (
      <div className="flow-page prepare-page prepare-page--success">
        <div className="success-card">
          <div className="success-card__icon" aria-hidden="true">
            ✅
          </div>
          <h1 className="success-card__title">Книга готова к чтению</h1>
          <p className="success-card__book">{savedBook.title}</p>
          <p className="prepare-page__note">
            Книга сохранена на устройстве и доступна офлайн.
          </p>

          <div className="success-card__actions">
            <button
              type="button"
              className="success-card__read"
              onClick={() => navigate(`/read/${savedBook.localId}`)}
            >
              Читать книгу
            </button>
            <button
              type="button"
              className="success-card__library"
              onClick={() => navigate("/")}
            >
              Вернуться в библиотеку
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedSteps = IMPORT_STEPS.slice(0, currentIndex);
  const activeStep = IMPORT_STEPS[currentIndex];

  return (
    <div className="flow-page prepare-page">
      <header className="flow-page__header">
        <h1 className="flow-page__title">Проверяем книгу</h1>
        <p className="flow-page__subtitle">Скачиваем и готовим к чтению офлайн</p>
      </header>

      <div className="prepare-card">
        <p className="prepare-card__headline" role="status">
          <span className="prepare-card__mark prepare-card__mark--active" aria-hidden="true">
            ⏳
          </span>
          Добавляем книгу…
        </p>

        <ul className="prepare-steps" aria-label="Этапы подготовки">
          {completedSteps.map((step) => (
            <li key={step.id} className="prepare-steps__item prepare-steps__item--done">
              <span className="prepare-steps__mark" aria-hidden="true">
                ✓
              </span>
              {step.label}
            </li>
          ))}

          {activeStep && (
            <li className="prepare-steps__item prepare-steps__item--active">
              <span className="prepare-steps__mark prepare-steps__mark--pulse" aria-hidden="true">
                ⏳
              </span>
              {activeStep.label}
            </li>
          )}
        </ul>
      </div>

      <p className="prepare-page__note">
        Это займёт несколько секунд. Пожалуйста, не закрывайте страницу.
      </p>
    </div>
  );
}

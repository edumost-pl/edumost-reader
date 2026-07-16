import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  OpenBookError,
  loadReadingPage,
  openBook,
  type BookReadingSession,
  type ReadingPage,
} from "../../reader";
import { MarkdownView } from "./MarkdownView";
import { TableOfContents } from "./TableOfContents";

export function BookReaderPage() {
  const { localId } = useParams<{ localId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<BookReadingSession | null>(null);
  const [currentPage, setCurrentPage] = useState<ReadingPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!localId) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    openBook(localId)
      .then(({ session: s, page }) => {
        if (cancelled) return;
        setSession(s);
        setCurrentPage(page);
        setExpandedVolumes(
          Object.fromEntries(s.toc.map((v) => [v.id, v.pages.length > 0]))
        );
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof OpenBookError ? e.message : "Не удалось открыть книгу");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [localId, navigate]);

  const handleSelectPage = useCallback(
    async (pagePath: string) => {
      if (!localId || !session || pagePath === currentPage?.page.path) return;

      setPageLoading(true);
      try {
        const page = await loadReadingPage(localId, session, pagePath);
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setError("Не удалось открыть страницу");
      } finally {
        setPageLoading(false);
      }
    },
    [localId, session, currentPage?.page.path]
  );

  const toggleVolume = useCallback((volumeId: string) => {
    setExpandedVolumes((prev) => ({ ...prev, [volumeId]: !prev[volumeId] }));
  }, []);

  useEffect(() => {
    if (!currentPage || !session) return;
    const volId = currentPage.volume.id;
    setExpandedVolumes((prev) => ({ ...prev, [volId]: true }));
  }, [currentPage?.page.path, session]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const sync = () => setTocOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (loading) {
    return (
      <div className="reader-page reader-page--loading">
          <div className="reader-loading" aria-busy="true">
          <div className="verify-card__ring" />
          <p>Открываем книгу…</p>
          <p className="reader-loading__hint">При необходимости скачиваем с GitHub</p>
        </div>
      </div>
    );
  }

  if (error || !session || !currentPage) {
    return (
      <div className="reader-page reader-page--error">
        <div className="reader-error-card">
          <p>{error ?? "Книга недоступна"}</p>
          <Link to="/" className="reader-error-card__back">
            Вернуться в библиотеку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-shell" data-theme={session.manifest.theme}>
      <div
        className={`reader-shell__backdrop${tocOpen ? " reader-shell__backdrop--visible" : ""}`}
        onClick={() => setTocOpen(false)}
        aria-hidden="true"
      />

      <aside className={`reader-shell__sidebar${tocOpen ? " reader-shell__sidebar--open" : ""}`}>
        <TableOfContents
          session={session}
          currentPagePath={currentPage.page.path}
          expandedVolumes={expandedVolumes}
          onToggleVolume={toggleVolume}
          onSelectPage={handleSelectPage}
          onClose={() => setTocOpen(false)}
        />
      </aside>

      <div className="reader-shell__main">
        <header className="reader-toolbar">
          <button
            type="button"
            className="reader-toolbar__menu"
            onClick={() => setTocOpen((v) => !v)}
            aria-label="Содержание"
            aria-expanded={tocOpen}
          >
            ☰
          </button>
          <Link to="/" className="reader-toolbar__library">
            Моя библиотека
          </Link>
        </header>

        <div className="reader-page">
          <header className="reader-header reader-header--compact">
            <div className="reader-header__meta">
              <p className="reader-header__series">{session.stored.series ?? session.manifest.title}</p>
              <h1 className="reader-header__book">{session.stored.title}</h1>
              <p className="reader-header__volume">{currentPage.volume.title}</p>
              <h2 className="reader-header__page">{currentPage.pageLabel}</h2>
            </div>
          </header>

          <article className={`reader-article${pageLoading ? " reader-article--loading" : ""}`} aria-busy={pageLoading}>
            <MarkdownView
              localId={session.stored.localId}
              pagePath={currentPage.page.path}
              markdown={currentPage.markdown}
            />
          </article>
        </div>
      </div>
    </div>
  );
}

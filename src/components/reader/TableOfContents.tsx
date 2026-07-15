import type { BookReadingSession, TocVolume } from "../../reader/types";

interface TableOfContentsProps {
  session: BookReadingSession;
  currentPagePath: string;
  expandedVolumes: Record<string, boolean>;
  onToggleVolume: (volumeId: string) => void;
  onSelectPage: (pagePath: string) => void;
  onClose?: () => void;
}

export function TableOfContents({
  session,
  currentPagePath,
  expandedVolumes,
  onToggleVolume,
  onSelectPage,
  onClose,
}: TableOfContentsProps) {
  return (
    <nav className="reader-toc" aria-label="Содержание">
      <div className="reader-toc__header">
        <h2 className="reader-toc__book">{session.manifest.title}</h2>
        {onClose && (
          <button type="button" className="reader-toc__close" onClick={onClose} aria-label="Закрыть содержание">
            ✕
          </button>
        )}
      </div>

      <div className="reader-toc__volumes">
        {session.toc.map((volume) => (
          <VolumeSection
            key={volume.id}
            volume={volume}
            expanded={expandedVolumes[volume.id] ?? true}
            currentPagePath={currentPagePath}
            onToggle={() => onToggleVolume(volume.id)}
            onSelectPage={(path) => {
              onSelectPage(path);
              onClose?.();
            }}
          />
        ))}
      </div>
    </nav>
  );
}

function VolumeSection({
  volume,
  expanded,
  currentPagePath,
  onToggle,
  onSelectPage,
}: {
  volume: TocVolume;
  expanded: boolean;
  currentPagePath: string;
  onToggle: () => void;
  onSelectPage: (path: string) => void;
}) {
  const hasPages = volume.pages.length > 0;

  return (
    <section className="reader-toc__volume">
      <button
        type="button"
        className="reader-toc__volume-btn"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="reader-toc__chevron" aria-hidden="true">
          {expanded ? "▼" : "▶"}
        </span>
        {volume.title}
      </button>

      {expanded && hasPages && (
        <ul className="reader-toc__pages">
          {volume.pages.map((page) => (
            <li key={page.path}>
              <button
                type="button"
                className={`reader-toc__page${page.path === currentPagePath ? " reader-toc__page--active" : ""}`}
                onClick={() => onSelectPage(page.path)}
                aria-current={page.path === currentPagePath ? "page" : undefined}
              >
                {page.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {expanded && !hasPages && (
        <p className="reader-toc__empty">Страницы появятся позже</p>
      )}
    </section>
  );
}

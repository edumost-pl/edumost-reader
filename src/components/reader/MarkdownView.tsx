import { useEffect, useMemo, useState } from "react";
import { renderMarkdown, revokeBlobUrls } from "../../reader";

interface MarkdownViewProps {
  localId: string;
  pagePath: string;
  markdown: string;
}

export function MarkdownView({ localId, pagePath, markdown }: MarkdownViewProps) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);

  const key = useMemo(() => `${localId}:${pagePath}`, [localId, pagePath]);

  useEffect(() => {
    let blobUrls: string[] = [];
    let cancelled = false;

    setError(null);
    setHtml("");

    renderMarkdown(localId, pagePath, markdown)
      .then((result) => {
        if (cancelled) {
          revokeBlobUrls(result.blobUrls);
          return;
        }
        blobUrls = result.blobUrls;
        setHtml(result.html);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось отобразить страницу");
      });

    return () => {
      cancelled = true;
      revokeBlobUrls(blobUrls);
    };
  }, [key, localId, pagePath, markdown]);

  if (error) {
    return <p className="reader-error">{error}</p>;
  }

  if (!html) {
    return (
      <div className="reader-loading" aria-busy="true">
        <div className="verify-card__ring" />
      </div>
    );
  }

  return (
    <div
      className="reader-prose"
      lang="ru"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

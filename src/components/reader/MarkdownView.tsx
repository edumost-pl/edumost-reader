import { useEffect, useMemo, useState } from "react";
import { renderMarkdown, revokeBlobUrls } from "../../reader";
import { splitMarkdownWithIllustrations } from "../../reader/illustration/parseBlocks";
import type { IllustrationParams, IllustrationRef } from "../../reader/illustration/types";
import { IllustrationImage } from "./IllustrationImage";

interface MarkdownViewProps {
  localId: string;
  bookId: string;
  pagePath: string;
  markdown: string;
  locale?: string;
  registryItems: IllustrationRef[];
  onOpenGallery: (index: number) => void;
}

interface HtmlChunk {
  key: string;
  html: string;
  blobUrls: string[];
}

export function MarkdownView({
  localId,
  bookId,
  pagePath,
  markdown,
  locale = "ru",
  registryItems,
  onOpenGallery,
}: MarkdownViewProps) {
  const [chunks, setChunks] = useState<Array<HtmlChunk | { key: string; ill: IllustrationParams }>>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  const segments = useMemo(() => splitMarkdownWithIllustrations(markdown), [markdown]);
  const key = useMemo(() => `${localId}:${pagePath}`, [localId, pagePath]);

  useEffect(() => {
    let cancelled = false;
    const allUrls: string[] = [];

    setError(null);
    setChunks([]);

    (async () => {
      const next: Array<HtmlChunk | { key: string; ill: IllustrationParams }> = [];
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!;
        if (seg.type === "illustration") {
          next.push({ key: `ill-${i}-${seg.params.id}`, ill: seg.params });
          continue;
        }
        if (!seg.text.trim()) continue;
        const result = await renderMarkdown(localId, pagePath, seg.text);
        allUrls.push(...result.blobUrls);
        next.push({ key: `md-${i}`, html: result.html, blobUrls: result.blobUrls });
      }
      if (cancelled) {
        revokeBlobUrls(allUrls);
        return;
      }
      setChunks(next);
    })().catch(() => {
      if (!cancelled) setError("Не удалось отобразить страницу");
    });

    return () => {
      cancelled = true;
      revokeBlobUrls(allUrls);
    };
  }, [key, localId, pagePath, segments]);

  function galleryIndexFor(id: string): number {
    const idx = registryItems.findIndex((r) => r.id === id && r.pagePath === pagePath);
    if (idx >= 0) return idx;
    return registryItems.findIndex((r) => r.id === id);
  }

  if (error) {
    return <p className="reader-error">{error}</p>;
  }

  if (chunks.length === 0) {
    return (
      <div className="reader-loading" aria-busy="true">
        <div className="verify-card__ring" />
      </div>
    );
  }

  return (
    <div className="reader-prose" lang={locale}>
      {chunks.map((chunk) => {
        if ("ill" in chunk) {
          const gIndex = galleryIndexFor(chunk.ill.id);
          return (
            <IllustrationImage
              key={chunk.key}
              localId={localId}
              bookId={bookId}
              locale={locale}
              params={chunk.ill}
              galleryIndex={gIndex >= 0 ? gIndex : 0}
              onOpenGallery={onOpenGallery}
            />
          );
        }
        return (
          <div key={chunk.key} dangerouslySetInnerHTML={{ __html: chunk.html }} />
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { bookContentStore } from "../../reader/content/bookContentStore";
import {
  getCachedIllustrationUrl,
  illustrationVersion,
  mimeForIllustrationPath,
  putIllustrationCache,
} from "../../reader/illustration/imageCache";
import { resolveIllustrationAsset } from "../../reader/illustration/resolveAsset";
import type { IllustrationParams } from "../../reader/illustration/types";

interface IllustrationImageProps {
  localId: string;
  bookId: string;
  locale?: string;
  params: IllustrationParams;
  /** Index in book registry for gallery */
  galleryIndex: number;
  onOpenGallery: (index: number) => void;
}

export function IllustrationImage({
  localId,
  bookId,
  locale = "ru",
  params,
  galleryIndex,
  onOpenGallery,
}: IllustrationImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState(params.id);
  const [missing, setMissing] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const blobRef = useRef<string | null>(null);

  // Lazy: observe proximity to viewport
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      const asset = await resolveIllustrationAsset(localId, params.id, locale);
      if (cancelled) return;
      setAlt(asset.alt || params.caption || params.id);

      if (asset.missing || !asset.path) {
        setMissing(true);
        return;
      }

      const bytes = await bookContentStore.getBytes(localId, asset.path);
      if (cancelled || !bytes) {
        setMissing(true);
        return;
      }

      const version = illustrationVersion(bytes);
      const mime = mimeForIllustrationPath(asset.path);

      let url = await getCachedIllustrationUrl(bookId, asset.path, version);
      if (!url) {
        url = await putIllustrationCache(bookId, asset.path, version, bytes, mime);
      }

      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      blobRef.current = url;
      setSrc(url);
      setMissing(false);
    })().catch(() => {
      if (!cancelled) setMissing(true);
    });

    return () => {
      cancelled = true;
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [visible, localId, bookId, params.id, params.caption, locale]);

  const width = params.width ?? "100%";

  return (
    <figure
      ref={rootRef}
      className={`edumost-ill${missing ? " edumost-ill--missing" : ""}`}
      style={{ width }}
      data-ill-id={params.id}
    >
      {missing ? (
        <div className="edumost-ill__placeholder" role="img" aria-label="Illustration not available yet">
          <span className="edumost-ill__placeholder-icon" aria-hidden="true">
            🖼
          </span>
          <span className="edumost-ill__placeholder-text">Illustration not available yet</span>
          <span className="edumost-ill__placeholder-id">{params.id}</span>
        </div>
      ) : src ? (
        <button
          type="button"
          className="edumost-ill__button"
          onClick={() => onOpenGallery(galleryIndex)}
          aria-label={alt || `Открыть иллюстрацию ${params.id}`}
        >
          <img className="edumost-ill__img" src={src} alt={alt} loading="lazy" decoding="async" />
        </button>
      ) : (
        <div className="edumost-ill__skeleton" aria-busy="true" aria-label="Загрузка иллюстрации" />
      )}
      {params.caption && <figcaption className="edumost-ill__caption">{params.caption}</figcaption>}
    </figure>
  );
}

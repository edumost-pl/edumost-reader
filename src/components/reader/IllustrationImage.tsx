import { useEffect, useRef, useState } from "react";
import { bookContentStore } from "../../reader/content/bookContentStore";
import { mimeForIllustrationPath } from "../../reader/illustration/imageCache";
import { resolveIllustrationAsset } from "../../reader/illustration/resolveAsset";
import type { IllustrationParams } from "../../reader/illustration/types";

interface IllustrationImageProps {
  localId: string;
  bookId: string;
  locale?: string;
  params: IllustrationParams;
  galleryIndex: number;
  onOpenGallery: (index: number) => void;
}

export function IllustrationImage({
  localId,
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

  // Lazy load when near viewport; also kick immediately if already visible
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
      { rootMargin: "240px 0px", threshold: 0 }
    );
    io.observe(el);

    // Fallback: if observer never fires (layout quirks), load after a tick
    const t = window.setTimeout(() => setVisible(true), 50);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      const asset = await resolveIllustrationAsset(localId, params.id);
      if (cancelled) return;

      setAlt(params.caption || asset.alt || params.id);

      if (asset.missing || !asset.path) {
        setMissing(true);
        setSrc(null);
        return;
      }

      const bytes = await bookContentStore.getBytes(localId, asset.path);
      if (cancelled) return;

      if (!bytes || bytes.byteLength === 0) {
        console.log("Not found (empty bytes):", asset.path);
        setMissing(true);
        return;
      }

      const mime = mimeForIllustrationPath(asset.path);
      const blob = new Blob([new Uint8Array(bytes)], { type: mime });
      const url = URL.createObjectURL(blob);

      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }

      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      blobRef.current = url;
      setSrc(url);
      setMissing(false);
      console.log("Inserted <img> from:", asset.path);
    })().catch((err) => {
      console.log("Illustration load error:", params.id, err);
      if (!cancelled) setMissing(true);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, localId, params.id, params.caption]);

  // Revoke blob only on unmount (not on StrictMode re-run mid-load)
  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, []);

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
          <img className="edumost-ill__img" src={src} alt={alt} decoding="async" />
        </button>
      ) : (
        <div className="edumost-ill__skeleton" aria-busy="true" aria-label="Загрузка иллюстрации" />
      )}
      {params.caption && <figcaption className="edumost-ill__caption">{params.caption}</figcaption>}
    </figure>
  );
}

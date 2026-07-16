import { useCallback, useEffect, useState } from "react";
import { bookContentStore } from "../../reader/content/bookContentStore";
import { mimeForIllustrationPath } from "../../reader/illustration/imageCache";
import { resolveIllustrationAsset } from "../../reader/illustration/resolveAsset";
import type { IllustrationRef } from "../../reader/illustration/types";

interface IllustrationGalleryProps {
  open: boolean;
  localId: string;
  bookId: string;
  locale?: string;
  items: IllustrationRef[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function IllustrationGallery({
  open,
  localId,
  items,
  index,
  onClose,
  onIndexChange,
}: IllustrationGalleryProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [missing, setMissing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const item = items[index];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange(Math.min(items.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, z + 0.25));
      if (e.key === "-") setZoom((z) => Math.max(0.5, z - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, items.length, onClose, onIndexChange]);

  useEffect(() => {
    setZoom(1);
  }, [index]);

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    let blobUrl: string | null = null;

    (async () => {
      setSrc(null);
      setMissing(false);
      const asset = await resolveIllustrationAsset(localId, item.id);
      if (cancelled) return;
      setAlt(item.caption || asset.alt || item.id);
      if (asset.missing || !asset.path) {
        setMissing(true);
        return;
      }
      const bytes = await bookContentStore.getBytes(localId, asset.path);
      if (cancelled || !bytes || bytes.byteLength === 0) {
        setMissing(true);
        return;
      }
      const mime = mimeForIllustrationPath(asset.path);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      blobUrl = url;
      setSrc(url);
      setMissing(false);
    })().catch((err) => {
      console.log("Gallery illustration error:", item.id, err);
      if (!cancelled) setMissing(true);
    });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [open, item, localId]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.25)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.25)), []);

  if (!open || !item) return null;

  return (
    <div className="ill-gallery" role="dialog" aria-modal="true" aria-label="Галерея иллюстраций">
      <div className="ill-gallery__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="ill-gallery__panel">
        <header className="ill-gallery__toolbar">
          <span className="ill-gallery__counter">
            {index + 1} / {items.length}
          </span>
          <div className="ill-gallery__actions">
            <button type="button" onClick={zoomOut} aria-label="Уменьшить">
              −
            </button>
            <button type="button" onClick={zoomIn} aria-label="Увеличить">
              +
            </button>
            <button type="button" onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>
        </header>

        <div className="ill-gallery__stage">
          <button
            type="button"
            className="ill-gallery__nav ill-gallery__nav--prev"
            disabled={index <= 0}
            onClick={() => onIndexChange(index - 1)}
            aria-label="Предыдущая"
          >
            ‹
          </button>

          <div className="ill-gallery__frame">
            {missing ? (
              <div className="edumost-ill__placeholder edumost-ill__placeholder--gallery">
                <span aria-hidden="true">🖼</span>
                <span>Illustration not available yet</span>
                <span>{item.id}</span>
              </div>
            ) : src ? (
              <img
                src={src}
                alt={alt}
                className="ill-gallery__img"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            ) : (
              <div className="edumost-ill__skeleton" aria-busy="true" />
            )}
          </div>

          <button
            type="button"
            className="ill-gallery__nav ill-gallery__nav--next"
            disabled={index >= items.length - 1}
            onClick={() => onIndexChange(index + 1)}
            aria-label="Следующая"
          >
            ›
          </button>
        </div>

        <p className="ill-gallery__caption">{alt || item.id}</p>
      </div>
    </div>
  );
}

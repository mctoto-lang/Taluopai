'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface SidePreviewProps {
  previewUrl: string;
  name?: string;
  /** The dialog content element to position against */
  dialogRef: React.RefObject<HTMLDivElement | null>;
  /** Image display width in px (default 340) */
  imgWidth?: number;
  /** Image display height in px (default 480) */
  imgHeight?: number;
  /** object-fit for the image: 'cover' (default) or 'contain' */
  objectFit?: 'cover' | 'contain';
  /** Show checkerboard background for transparent images (default false) */
  showTransparency?: boolean;
}

/** Fixed side panel positioned left or right of the dialog */
export function SidePreview({
  previewUrl,
  name,
  dialogRef,
  imgWidth = 340,
  imgHeight = 480,
  objectFit = 'cover',
  showTransparency = false,
}: SidePreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
    };
  }, []);

  // Calculate position: pick the side with more free space
  useEffect(() => {
    function calcPosition() {
      const el = dialogRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const gap = 12;

      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      const isRight = spaceRight >= imgWidth + gap || spaceRight >= spaceLeft;

      const top = Math.max(8, rect.top + (rect.height - imgHeight - (name ? 36 : 0)) / 2);

      if (isRight) {
        setStyle({
          left: rect.right + gap,
          top: Math.min(top, window.innerHeight - imgHeight - (name ? 52 : 16)),
        });
      } else {
        setStyle({
          left: rect.left - imgWidth - gap,
          top: Math.min(top, window.innerHeight - imgHeight - (name ? 52 : 16)),
        });
      }
    }

    calcPosition();
    window.addEventListener('resize', calcPosition);
    return () => window.removeEventListener('resize', calcPosition);
  }, [dialogRef, imgWidth, imgHeight, name]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-[10000] pointer-events-none',
        'transition-all duration-200',
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
      )}
      style={style}
    >
      <div className="rounded-xl border-2 border-purple-400/60 shadow-2xl shadow-purple-500/30 overflow-hidden">
        <div
          className={cn(
            'relative',
            showTransparency
              ? 'checkerboard-md'
              : 'bg-white dark:bg-zinc-900',
          )}
          style={{ width: imgWidth, height: imgHeight }}
        >
          <img
            src={previewUrl}
            alt={name ? `${name} 放大预览` : '放大预览'}
            className={cn(
              objectFit === 'contain' ? 'object-contain' : 'object-cover',
            )}
            style={{ width: imgWidth, height: imgHeight }}
            draggable={false}
          />
        </div>
        {name && (
          <div className="px-3 py-2 border-t border-border/50 bg-white dark:bg-zinc-900">
            <p className="text-sm font-medium truncate">{name}</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

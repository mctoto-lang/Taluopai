'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TarotCard } from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { getWorkspaceConfig } from '@/lib/workspace-config';

interface TarotCardProps {
  card: TarotCard;
  isBound: boolean;
  previewUrl?: string;
  onClick: () => void;
}

export function TarotCardComponent({ card, isBound, previewUrl, onClick }: TarotCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const workMode = useAppStore((s) => s.workMode);
  const workspaceConfig = getWorkspaceConfig(workMode);
  const emblemSrc = workspaceConfig.emblemSrc;

  const categoryLabels: Record<string, string> = {
    major: '大阿尔卡纳', wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币',
    joker: '大小王', spade: '黑桃', heart: '红心', club: '梅花', diamond: '方块',
  };

  const categoryBadgeColors: Record<string, string> = {
    major: 'bg-purple-600/80 text-white border-purple-500/50',
    wands: 'bg-red-600/80 text-white border-red-500/50',
    cups: 'bg-blue-600/80 text-white border-blue-500/50',
    swords: 'bg-slate-500/80 text-white border-slate-400/50',
    pentacles: 'bg-green-600/80 text-white border-green-500/50',
    joker: 'bg-rose-600/80 text-white border-rose-500/50',
    spade: 'bg-slate-800/80 text-white border-slate-600/50',
    heart: 'bg-red-600/80 text-white border-red-500/50',
    club: 'bg-green-700/80 text-white border-green-600/50',
    diamond: 'bg-amber-500/80 text-white border-amber-400/50',
  };

  const handleThumbEnter = useCallback(() => {
    if (!previewUrl) return;
    setShowPreview(true);
  }, [previewUrl]);

  const handleThumbLeave = useCallback(() => {
    setShowPreview(false);
  }, []);

  const isRedSuit = card.category === 'heart' || card.category === 'diamond';

  const handleClick = useCallback(() => {
    setShowPreview(false);
    onClick();
  }, [onClick]);

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden p-0 transition-all duration-200',
        'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1',
        'hover:border-purple-400/50 active:scale-[1.02]',
        isBound && 'ring-1 ring-green-500/40',
      )}
    >
      {/* Card body — tarot card aspect ratio ~1:1.75 */}
      <div className="flex flex-col" style={{ aspectRatio: '5 / 8' }}>
        {/* Top area — white background */}
        <div className="relative flex-1 flex items-center justify-center min-h-0 bg-white">
          {/* Category badge — colored */}
          <Badge
            className={cn(
              'absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 border backdrop-blur-sm',
              categoryBadgeColors[card.category] || 'bg-black/30 text-white/80 border-white/10'
            )}
          >
            {categoryLabels[card.category] || card.category}
          </Badge>

          {/* Card icon */}
          <img
            src={emblemSrc}
            alt={card.nameCn}
            className="w-8 h-8 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
            draggable={false}
          />
        </div>

        {/* Bottom info area */}
        <div className="shrink-0 px-2 pb-2 pt-1.5 flex flex-col gap-0.5">
          {/* Names with emoji */}
          <h3 className="font-bold text-xs leading-tight text-foreground truncate">
            <span className={cn('mr-0.5', isRedSuit && 'text-red-500')}>{card.emoji}</span>
            {card.nameCn}
          </h3>
          <p className="text-[10px] text-muted-foreground leading-tight truncate">
            {card.nameEn}
          </p>

          {/* Binding status row */}
          <div className="flex items-center gap-1 mt-0.5 pt-1 border-t border-border/50">
            {isBound ? (
              <>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                <span className="text-[9px] font-medium text-green-600 dark:text-green-400">
                  已绑定
                </span>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="预览"
                    onMouseEnter={handleThumbEnter}
                    onMouseLeave={handleThumbLeave}
                    className="ml-auto h-5 w-5 rounded object-cover border border-border/50 cursor-zoom-in hover:ring-2 hover:ring-purple-400 transition-all"
                  />
                )}
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                <span className="text-[9px] text-muted-foreground">
                  未绑定
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Centered hover large preview — rendered via Portal */}
      {showPreview && previewUrl && (
        <PreviewPortal
          previewUrl={previewUrl}
          nameCn={card.nameCn}
          nameEn={card.nameEn}
          description={card.description}
        />
      )}
    </Card>
  );
}

/** Portal-based center preview overlay */
function PreviewPortal({
  previewUrl,
  nameCn,
  nameEn,
  description,
}: {
  previewUrl: string;
  nameCn: string;
  nameEn: string;
  description: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
    };
  }, []);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none',
        'transition-opacity duration-200',
        mounted ? 'opacity-100' : 'opacity-0',
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Preview card — tarot ratio */}
      <div
        className={cn(
          'relative z-10 rounded-2xl border shadow-2xl shadow-black/50 overflow-hidden',
          'bg-white dark:bg-zinc-900 p-2',
          'transition-transform duration-300',
          mounted ? 'scale-100' : 'scale-90',
        )}
      >
        <img
          src={previewUrl}
          alt={`${nameCn} 大图预览`}
          className="w-60 h-[420px] object-cover rounded-xl"
          draggable={false}
        />
        <div className="mt-2 text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">{nameCn}</p>
          <p className="text-xs text-muted-foreground">{nameEn}</p>
          <p className="text-xs text-muted-foreground/80 leading-relaxed px-2">{description}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

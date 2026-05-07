'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { ImagePlus, Unlink, Filter, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { TAROT_CARDS } from '@/lib/tarot-data';
import { SidePreview } from '@/components/side-preview';

interface ImageSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number | null;
  cardName?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageSelectorDialog({
  open,
  onOpenChange,
  cardId,
  cardName,
}: ImageSelectorDialogProps) {
  const uploadedImages = useAppStore((s) => s.uploadedImages);
  const cards = useAppStore((s) => s.cards);
  const bindImage = useAppStore((s) => s.bindImage);
  const unbindImage = useAppStore((s) => s.unbindImage);

  const [filterMode, setFilterMode] = useState<'all' | 'unused'>('all');
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const currentCard = useMemo(() => {
    if (!cardId) return null;
    return cards.find((c) => c.id === cardId) || TAROT_CARDS.find((c) => c.id === cardId);
  }, [cardId, cards]);

  const boundImageId = currentCard?.boundImageId;

  // Get all used image IDs except the current card's bound image
  const usedImageIds = useMemo(() => {
    const ids = new Set<string>();
    cards.forEach((c) => {
      if (c.boundImageId && c.id !== cardId) {
        ids.add(c.boundImageId);
      }
    });
    return ids;
  }, [cards, cardId]);

  const filteredImages = useMemo(() => {
    if (filterMode === 'unused') {
      return uploadedImages.filter((img) => !usedImageIds.has(img.id));
    }
    return uploadedImages;
  }, [uploadedImages, filterMode, usedImageIds]);

  // Build preview map for quick lookup
  const previewMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const img of uploadedImages) {
      map[img.id] = img.preview;
    }
    return map;
  }, [uploadedImages]);

  const handleSelectImage = (imageId: string) => {
    if (!cardId || usedImageIds.has(imageId)) return;
    bindImage(cardId, imageId);
    setHoveredImageId(null);
    onOpenChange(false);
  };

  const handleUnbind = () => {
    if (!cardId) return;
    unbindImage(cardId);
  };

  const handleImageMouseEnter = useCallback((imageId: string) => {
    setHoveredImageId(imageId);
  }, []);

  const handleImageMouseLeave = useCallback(() => {
    setHoveredImageId(null);
  }, []);

  const displayName = cardName || currentCard?.nameCn || `牌 #${cardId}`;

  // Get hovered image info
  const hoveredImage = hoveredImageId
    ? uploadedImages.find((img) => img.id === hoveredImageId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogRef}
        className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="size-5" />
            为 {displayName} 选择图片
          </DialogTitle>
          <DialogDescription>
            {boundImageId ? '已绑定图片，可选择更换或解除绑定' : '点击可用图片进行绑定'}
          </DialogDescription>
        </DialogHeader>

        {/* Unbind button */}
        {boundImageId && (
          <div className="flex justify-start">
            <Button variant="outline" size="sm" onClick={handleUnbind}>
              <Unlink className="size-4" />
              解除绑定
            </Button>
          </div>
        )}

        {/* Filter */}
        {uploadedImages.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <div className="flex gap-1">
              <Button
                variant={filterMode === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterMode('all')}
                className="text-xs"
              >
                显示全部
              </Button>
              <Button
                variant={filterMode === 'unused' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterMode('unused')}
                className="text-xs"
              >
                仅未使用
              </Button>
            </div>
          </div>
        )}

        {/* Image grid */}
        <div className="flex-1 min-h-0">
          {uploadedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="size-12 mb-3 opacity-40" />
              <p className="text-sm">还没有上传图片</p>
              <p className="text-xs mt-1">请先在图片上传对话框中上传图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredImages.map((img) => {
                const isUsed = usedImageIds.has(img.id);
                const isCurrentBound = img.id === boundImageId;

                return (
                  <div
                    key={img.id}
                    onClick={() => handleSelectImage(img.id)}
                    onMouseEnter={() => handleImageMouseEnter(img.id)}
                    onMouseLeave={handleImageMouseLeave}
                    className={`relative group rounded-lg border p-2 transition-all cursor-pointer ${
                      isCurrentBound
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : isUsed
                        ? 'opacity-40 cursor-not-allowed border-muted bg-muted/30'
                        : 'hover:border-primary/50 hover:ring-2 hover:ring-primary/10 hover:bg-muted/30'
                    }`}
                  >
                    <div className="relative aspect-[3/4] rounded overflow-hidden mb-1.5 bg-black/5">
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-full h-full object-cover"
                      />
                      {isCurrentBound && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary bg-background/80 px-1.5 py-0.5 rounded">
                            当前
                          </span>
                        </div>
                      )}
                      {isUsed && !isCurrentBound && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                            已使用
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate">{img.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {img.width}×{img.height} · {formatFileSize(img.size)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {filteredImages.length === 0 && uploadedImages.length > 0 && filterMode === 'unused' && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">所有图片已被使用</p>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Fixed side preview beside the dialog */}
      {open && hoveredImage && previewMap[hoveredImage.id] && (
        <SidePreview
          previewUrl={previewMap[hoveredImage.id]}
          name={hoveredImage.file.name}
          dialogRef={dialogRef}
        />
      )}
    </Dialog>
  );
}

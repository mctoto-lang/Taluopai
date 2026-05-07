'use client';

import { useSyncExternalStore, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getWorkspaceConfig, getCardsByCategory } from '@/lib/workspace-config';
import { useAppStore } from '@/lib/store';
import { TarotCardComponent } from '@/components/tarot-card';
import { Wand2, Link2Off } from 'lucide-react';

interface CardGridProps {
  onCardClick: (cardId: number) => void;
}

const categoryEmojis: Record<string, string> = {
  major: '🃏', wands: '🔥', cups: '💧', swords: '⚔️', pentacles: '💰',
  joker: '🃏',
};

const emptySubscribe = () => () => {};

export function CardGrid({ onCardClick }: CardGridProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const cards = useAppStore((s) => s.cards);
  const uploadedImages = useAppStore((s) => s.uploadedImages);
  const bindAllImages = useAppStore((s) => s.bindAllImages);
  const unbindAllImages = useAppStore((s) => s.unbindAllImages);
  const workMode = useAppStore((s) => s.workMode);
  const workspaceConfig = getWorkspaceConfig(workMode);
  const { categories, maxCards } = workspaceConfig;

  const boundCount = useMemo(() => cards.filter((c) => c.boundImageId).length, [cards]);
  const hasImages = uploadedImages.length > 0;
  const hasBindings = boundCount > 0;
  const canAutoBind = hasImages && boundCount < maxCards;

  // Build a map of imageId -> preview URL
  const previewMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const img of uploadedImages) {
      map[img.id] = img.preview;
    }
    return map;
  }, [uploadedImages]);

  // Build a map of cardId -> bound preview URL
  const cardPreviewMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const card of cards) {
      if (card.boundImageId && previewMap[card.boundImageId]) {
        map[card.id] = previewMap[card.boundImageId];
      }
    }
    return map;
  }, [cards, previewMap]);

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="flex-shrink-0 h-9 px-4 rounded-md bg-muted/80 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 mt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs key={workMode} defaultValue={categories[0]?.key || 'major'} className="w-full">
        {/* Tab triggers */}
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/80">
            {categories.map((cat) => {
              const catCards = getCardsByCategory(cat.key, workMode);
              const boundInCat = catCards.filter(
                (c) => cards.find((sc) => sc.id === c.id)?.boundImageId
              ).length;

              return (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background"
                >
                  {categoryEmojis[cat.key] && (
                    <span className="text-base sm:text-lg">{categoryEmojis[cat.key]}</span>
                  )}
                  <span className="flex items-center">
                    {(cat.key === 'heart' || cat.key === 'diamond') && (
                      <span className="text-red-500 mr-0.5">{cat.labelCn.charAt(0)}</span>
                    )}
                    <span>{(cat.key === 'heart' || cat.key === 'diamond') ? cat.labelCn.slice(1) : cat.labelCn}</span>
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    ({boundInCat}/{catCards.length})
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Action bar */}
        {(canAutoBind || hasBindings) && (
          <div className="flex items-center justify-between mt-3 mb-1 px-1">
            <p className="text-xs text-muted-foreground">
              已绑定 <span className="font-semibold text-foreground">{boundCount}</span> / {maxCards} 张卡片
            </p>
            <div className="flex items-center gap-2">
              {canAutoBind && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bindAllImages}
                  className="h-8 gap-1.5 text-xs border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/50 dark:hover:text-purple-200"
                >
                  <Wand2 className="size-3.5" />
                  一键分配绑定
                </Button>
              )}
              {hasBindings && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={unbindAllImages}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Link2Off className="size-3.5" />
                  全部解绑
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tab contents */}
        {categories.map((cat) => {
          const catCards = getCardsByCategory(cat.key, workMode);
          return (
            <TabsContent key={cat.key} value={cat.key} className="mt-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                {catCards.map((tarotCard) => {
                  const storeCard = cards.find((c) => c.id === tarotCard.id);
                  const isBound = !!storeCard?.boundImageId;
                  const previewUrl = cardPreviewMap[tarotCard.id];

                  return (
                    <TarotCardComponent
                      key={tarotCard.id}
                      card={storeCard || tarotCard}
                      isBound={isBound}
                      previewUrl={previewUrl}
                      onClick={() => onCardClick(tarotCard.id)}
                    />
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

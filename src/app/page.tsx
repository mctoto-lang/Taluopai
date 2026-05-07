'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { TAROT_CARDS } from '@/lib/tarot-data';
import { POKER_CARDS } from '@/lib/poker-data';
import { getWorkspaceConfig } from '@/lib/workspace-config';
import { useToast } from '@/hooks/use-toast';
import { exportAllCards } from '@/lib/image-processor';

import { Navigation } from '@/components/navigation';
import { CardGrid } from '@/components/card-grid';
import { ImageUploadDialog } from '@/components/image-upload-dialog';
import { TemplateManagerDialog } from '@/components/template-manager-dialog';
import { SettingsDialog } from '@/components/settings-dialog';
import { ImageSelectorDialog } from '@/components/image-selector-dialog';
import { ExportProgressDialog } from '@/components/export-progress-dialog';
import { ExportValidationDialog } from '@/components/export-validation-dialog';
import { CardTemplateDialog } from '@/components/card-template-dialog';

import { Sparkles, Info } from 'lucide-react';

export default function HomePage() {
  const { toast } = useToast();

  // Dialog states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [cardTemplatesOpen, setCardTemplatesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);

  // Selected card for image binding
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Store data
  const cards = useAppStore((s) => s.cards);
  const uploadedImages = useAppStore((s) => s.uploadedImages);
  const templates = useAppStore((s) => s.templates);
  const settings = useAppStore((s) => s.settings);
  const setExporting = useAppStore((s) => s.setExporting);
  const setExportProgress = useAppStore((s) => s.setExportProgress);
  const workMode = useAppStore((s) => s.workMode);
  const wsConfig = getWorkspaceConfig(workMode);
  const maxCards = wsConfig.maxCards;

  // Counts
  const boundCount = useMemo(() => cards.filter((c) => c.boundImageId).length, [cards]);
  const uploadedCount = uploadedImages.length;
  const templateCount = templates.length;

  // Card click handler
  const handleCardClick = useCallback((cardId: number) => {
    setSelectedCardId(cardId);
    setSelectorOpen(true);
  }, []);

  // Get selected card info
  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;
    return cards.find((c) => c.id === selectedCardId) || TAROT_CARDS.find((c) => c.id === selectedCardId) || POKER_CARDS.find((c) => c.id === selectedCardId);
  }, [selectedCardId, cards]);

  // Export validation
  const validateExport = useCallback((): string[] => {
    const issues: string[] = [];

    const unboundCards = cards.filter((c) => !c.boundImageId);
    if (unboundCards.length > 0) {
      issues.push(`还有 ${unboundCards.length} 张卡片未绑定图片（如：${unboundCards.slice(0, 3).map((c) => c.nameCn).join('、')}${unboundCards.length > 3 ? ' 等' : ''}）`);
    }

    if (templateCount < maxCards) {
      issues.push(`模板不足：已上传 ${templateCount}/${maxCards} 张模板`);
    }

    if (settings.width <= 0 || settings.height <= 0) {
      issues.push('处理设置无效：输出尺寸必须为正整数');
    }

    return issues;
  }, [cards, templateCount, maxCards, settings]);

  // Start the actual export process — fully client-side using Canvas + JSZip
  const doExport = useCallback(async () => {
    setExportProgressOpen(true);
    setExporting(true);
    setExportProgress(0);

    try {
      const cardsToExport = cards.filter((c) => c.boundImageId);

      if (cardsToExport.length === 0) {
        throw new Error('没有已绑定的卡片可导出');
      }

      // Build card entries with image/template URLs
      const cardEntries = cardsToExport
        .map((card) => {
          const image = uploadedImages.find((img) => img.id === card.boundImageId);
          const template = templates.find((t) => t.id === card.id);
          if (!image || !template) return null;
          return {
            id: card.id,
            nameCn: card.nameCn,
            imageUrl: image.preview,
            templatePreview: template.preview,
          };
        })
        .filter(Boolean) as Array<{
        id: number;
        nameCn: string;
        imageUrl: string;
        templatePreview: string;
      }>;

      if (cardEntries.length === 0) {
        throw new Error('没有找到匹配的图片和模板，请检查绑定和模板');
      }

      // Template dimensions from first template
      const firstTemplate = templates.find((t) => t.id === cardsToExport[0]?.id);
      const templateWidth = firstTemplate?.width || settings.width;
      const templateHeight = firstTemplate?.height || settings.height;

      console.log(`[Export] Processing ${cardEntries.length} cards client-side...`);

      // Process all cards client-side
      const zipBlob = await exportAllCards(
        cardEntries,
        {
          mode: settings.mode,
          width: settings.width,
          height: settings.height,
          templateWidth,
          templateHeight,
        },
        (index) => {
          setExportProgress(index);
        }
      );

      // Generate download filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `${wsConfig.exportFilename}_${timestamp}.zip`;

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(maxCards);

      toast({
        title: '导出成功',
        description: `已成功生成 ${cardEntries.length} 张${wsConfig.label.replace('工作台', '')}图片并打包下载`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: '导出失败',
        description: error instanceof Error ? error.message : '处理过程中发生错误',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [cards, uploadedImages, templates, settings, setExporting, setExportProgress, toast, wsConfig, maxCards]);

  // Handle export button click
  const handleExport = useCallback(() => {
    const issues = validateExport();
    if (issues.length > 0 && (boundCount < maxCards || templateCount < maxCards)) {
      setValidationOpen(true);
    } else {
      doExport();
    }
  }, [validateExport, boundCount, templateCount, doExport, maxCards]);

  // Confirm export from validation dialog
  const handleConfirmExport = useCallback(() => {
    setValidationOpen(false);
    doExport();
  }, [doExport]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navigation
        onOpenUpload={() => setUploadOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenCardTemplates={() => setCardTemplatesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExport={handleExport}
        boundCount={boundCount}
        uploadedCount={uploadedCount}
        templateCount={templateCount}
        maxCards={maxCards}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-background to-background dark:from-purple-950/20 dark:via-background dark:to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/30 via-transparent to-transparent dark:from-purple-900/20" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="size-5 text-purple-500" />
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 bg-clip-text text-transparent">
                  {wsConfig.heroTitle}
                </h2>
                <Sparkles className="size-5 text-amber-500" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                {wsConfig.heroDescription}
              </p>

              {/* Quick stats */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">已绑定</span>
                  <span className="font-semibold">{boundCount}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">已上传</span>
                  <span className="font-semibold">{uploadedCount}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-muted-foreground">模板</span>
                  <span className="font-semibold">{templateCount}</span>
                </div>
              </div>

              {/* Guide tips */}
              {boundCount === 0 && uploadedCount === 0 && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-muted/80 px-4 py-2 text-xs text-muted-foreground border">
                  <Info className="size-3.5" />
                  <span>{wsConfig.guideTip}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Grid Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <CardGrid onCardClick={handleCardClick} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>{wsConfig.emoji} {wsConfig.footerText}</p>
            <p>使用 Next.js + Canvas + JSZip 构建</p>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <ImageUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <TemplateManagerDialog open={templatesOpen} onOpenChange={setTemplatesOpen} />
      <CardTemplateDialog open={cardTemplatesOpen} onOpenChange={setCardTemplatesOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ImageSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        cardId={selectedCardId}
        cardName={selectedCard?.nameCn}
      />
      <ExportProgressDialog open={exportProgressOpen} onOpenChange={setExportProgressOpen} />
      <ExportValidationDialog
        open={validationOpen}
        onOpenChange={setValidationOpen}
        issues={validateExport()}
        onConfirm={handleConfirmExport}
      />
    </div>
  );
}

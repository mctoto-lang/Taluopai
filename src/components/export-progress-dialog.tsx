'use client';

import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { CardLoader } from '@/components/card-loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { getWorkspaceConfig } from '@/lib/workspace-config';

const PHRASES = [
  '星尘拭牌✨',
  '连接月光🌙',
  '唤醒卡灵🃏',
  '结界展开🌀',
  '捕捉预兆🍃',
  '折叠时空⏳',
  '咒语入耳👂',
  '灵摆校准🔮',
  '雾中寻影🍵',
  '心灯点亮💡',
  '萤火点灯✨',
  '夜风借语🌬️',
  '水镜初成💧',
  '整理丝线🧵',
  '云译天机☁️',
  '晨露点睛🌄',
  '时空微调⏰',
  '筛星为砂🔍',
  '猫尾清念🐾',
  '为你眨眼😉',
];

interface ExportProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Generate CSS keyframes for N scrolling words */
function generateSpinKeyframes(count: number, duration: number): string {
  const step = 100 / count;
  const steps: string[] = [];

  for (let i = 0; i < count; i++) {
    const appearPct = (i * step).toFixed(2);
    const settlePct = ((i + 0.6) * step).toFixed(2);
    const overshootY = -(i * 100 + 2);
    const settleY = -(i * 100);

    if (i === 0) {
      steps.push(`0% { transform: translateY(${overshootY}%); }`);
      steps.push(`${settlePct}% { transform: translateY(${settleY}%); }`);
    } else {
      steps.push(`${appearPct}% { transform: translateY(${overshootY}%); }`);
      steps.push(`${settlePct}% { transform: translateY(${settleY}%); }`);
    }
  }

  // Loop back: last step overshoots back to first word
  steps.push(`100% { transform: translateY(-2%); }`);

  return `@keyframes spin-tarot { ${steps.join(' ')} } .word { animation: spin-tarot ${duration}s linear infinite; }`;
}

export function ExportProgressDialog({ open, onOpenChange }: ExportProgressDialogProps) {
  const isExporting = useAppStore((s) => s.isExporting);
  const exportProgress = useAppStore((s) => s.exportProgress);
  const workMode = useAppStore((s) => s.workMode);
  const maxCards = getWorkspaceConfig(workMode).maxCards;

  const progressValue = (exportProgress / maxCards) * 100;

  const phraseCount = PHRASES.length;

  // Generate keyframes CSS for 20 phrases, ~1.5s per word = 30s total
  const dynamicCSS = useMemo(() => generateSpinKeyframes(phraseCount, 30), []);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (isExporting) return;
        onOpenChange(val);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!isExporting}
        onPointerDownOutside={(e) => {
          if (isExporting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isExporting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5" />
            导出牌组
          </DialogTitle>
          <DialogDescription>
            {isExporting ? '正在处理中，请勿关闭窗口...' : '导出完成'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Loader / Status Icon */}
          <div className="relative">
            {isExporting ? (
              <CardLoader className="text-purple-600 dark:text-purple-400" />
            ) : (
              <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Download className="size-10 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>

          {/* Progress text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              {isExporting
                ? `正在生成第 ${exportProgress}/${maxCards} 张...`
                : '导出完成！'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isExporting
                ? '处理图片中，请耐心等待'
                : `成功生成 ${maxCards} 张${workMode === 'poker' ? '扑克牌' : '塔罗牌'}图片`}
            </p>
          </div>

          {/* Linear progress bar */}
          <div className="w-full space-y-1.5">
            <Progress value={progressValue} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{exportProgress} / {maxCards}</span>
              <span>{progressValue.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

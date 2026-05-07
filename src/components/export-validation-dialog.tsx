'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Download, XCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getWorkspaceConfig } from '@/lib/workspace-config';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExportValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: string[];
  onConfirm: () => void;
}

export function ExportValidationDialog({
  open,
  onOpenChange,
  issues,
  onConfirm,
}: ExportValidationDialogProps) {
  const workMode = useAppStore((s) => s.workMode);
  const maxCards = getWorkspaceConfig(workMode).maxCards;
  const hasIssues = issues.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasIssues ? (
              <>
                <AlertTriangle className="size-5 text-amber-500" />
                导出检查
              </>
            ) : (
              <>
                <CheckCircle2 className="size-5 text-green-500" />
                准备就绪
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {hasIssues ? (
                <>
                  <p>发现以下问题，建议修复后再导出：</p>
                  <ul className="space-y-2">
                    {issues.map((issue, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm bg-destructive/5 border border-destructive/20 rounded-lg p-2.5"
                      >
                        <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    你可以忽略这些警告继续导出，但结果可能不符合预期。
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="size-10 text-green-500" />
                  </div>
                  <p className="text-sm text-center">
                    {`所有检查通过，可以开始导出 ${maxCards} 张${workMode === 'poker' ? '扑克牌' : '塔罗牌'}图片。`}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={!hasIssues ? 'gap-2' : 'gap-2'}
          >
            <Download className="size-4" />
            {hasIssues ? '确认导出' : '开始导出'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

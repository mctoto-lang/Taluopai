'use client';

import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { LayoutTemplate, Upload, X, AlertTriangle, ImageIcon, Loader2, CheckCircle2, Save, FolderOpen, Trash2, Plus, Star, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { getWorkspaceConfig } from '@/lib/workspace-config';

interface TemplateManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TemplateManagerDialog({ open, onOpenChange }: TemplateManagerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const templates = useAppStore((s) => s.templates);
  const setTemplates = useAppStore((s) => s.setTemplates);
  const setSingleTemplate = useAppStore((s) => s.setSingleTemplate);
  const removeTemplate = useAppStore((s) => s.removeTemplate);
  const templateGroups = useAppStore((s) => s.templateGroups);
  const saveTemplateGroup = useAppStore((s) => s.saveTemplateGroup);
  const deleteTemplateGroup = useAppStore((s) => s.deleteTemplateGroup);
  const loadTemplateGroup = useAppStore((s) => s.loadTemplateGroup);

  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [showSaveGroup, setShowSaveGroup] = useState(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState<string | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const workMode = useAppStore((s) => s.workMode);
  const maxCards = getWorkspaceConfig(workMode).maxCards;

  const templateCount = templates.length;
  const progressValue = (templateCount / maxCards) * 100;

  const dimensionWarning = useMemo(() => {
    if (templates.length < 2) return null;
    const first = templates[0];
    const hasMismatch = templates.some(
      (t) => t.width !== first.width || t.height !== first.height
    );
    if (hasMismatch) {
      return `模板尺寸不一致：检测到多种尺寸 (${[...new Set(templates.map((t) => `${t.width}×${t.height}`))].join(', ')})`;
    }
    return null;
  }, [templates]);

  const triggerUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      await setTemplates(files);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } finally {
      setIsUploading(false);
    }
  }, [setTemplates]);

  const triggerSingleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      await setSingleTemplate(file);
      setUploadSuccess(true);
      toast({
        title: '单图模板已应用',
        description: `已将「${file.name}」应用到全部 ${maxCards} 个${workMode === 'poker' ? '扑克牌' : '塔罗牌'}位置`,
      });
      setTimeout(() => setUploadSuccess(false), 2000);
    } finally {
      setIsUploading(false);
    }
  }, [setSingleTemplate, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      triggerUpload(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      triggerSingleUpload(files[0]);
    }
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      triggerUpload(Array.from(files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleSaveGroup = async () => {
    const name = groupName.trim() || `模板组 ${templateGroups.length + 1}`;
    setIsSavingGroup(true);
    try {
      await saveTemplateGroup(name);
      setGroupName('');
      setShowSaveGroup(false);
      toast({
        title: '保存成功',
        description: `模板组「${name}」已保存（${templateCount} 张模板）`,
      });
    } catch (e) {
      console.error('Save group failed:', e);
      toast({
        title: '保存失败',
        description: '存储空间不足，请清理浏览器数据后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleLoadGroup = async (groupId: string) => {
    const group = templateGroups.find(g => g.id === groupId);
    setIsLoadingGroup(groupId);
    try {
      await loadTemplateGroup(groupId);
      toast({
        title: '加载成功',
        description: `模板组「${group?.name || ''}」已加载`,
      });
    } catch (e) {
      console.error('Load group failed:', e);
      toast({
        title: '加载失败',
        description: '无法加载该模板组数据',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGroup(null);
    }
  };



  const templateMap = useMemo(() => {
    const map = new Map<number, (typeof templates)[number]>();
    templates.forEach((t) => map.set(t.id, t));
    return map;
  }, [templates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="size-5" />
            模板管理
          </DialogTitle>
          <DialogDescription>
            {`上传 ${maxCards} 张模板图片，或使用单张图片应用到全部位置，也可以从已保存的模板组中加载`}
          </DialogDescription>
        </DialogHeader>

        {/* Saved template groups */}
        {templateGroups.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Star className="size-3.5 text-amber-500" />
                已保存的模板组 ({templateGroups.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {templateGroups.map((group) => {
                const isCurrentLoading = isLoadingGroup === group.id;
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2 hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail preview */}
                    <div className="flex -space-x-2 shrink-0">
                      {group.thumbnailIds.slice(0, 4).map((tid) => (
                        <div
                          key={tid}
                          className="size-8 rounded border-2 border-background overflow-hidden bg-muted flex items-center justify-center"
                        >
                          <span className="text-[8px] text-muted-foreground/50">{tid}</span>
                        </div>
                      ))}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{group.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {group.templateCount} 张 · {formatTimestamp(group.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 px-2.5 text-[11px] gap-1 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleLoadGroup(group.id)}
                        disabled={isCurrentLoading}
                      >
                        {isCurrentLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <FolderOpen className="size-3.5" />
                        )}
                        使用此模板组
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-[10px] text-destructive hover:text-destructive"
                        onClick={() => deleteTemplateGroup(group.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator />
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2">
          <div className="bg-zinc-900 dark:bg-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-zinc-100">
              <span className="flex items-center gap-2">
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin text-amber-400" />
                ) : uploadSuccess ? (
                  <CheckCircle2 className="size-4 text-green-400" />
                ) : (
                  <LayoutTemplate className="size-4" />
                )}
                {isUploading
                  ? '正在处理模板图片...'
                  : uploadSuccess
                    ? `上传完成！已上传 ${templateCount}/${maxCards} 张模板`
                    : `已上传 ${templateCount}/${maxCards} 张模板`}
              </span>
              <span className="text-zinc-400">{progressValue.toFixed(0)}%</span>
            </div>
            <Progress
              value={progressValue}
              className={`h-2 bg-zinc-700 transition-all duration-500 ${
                isUploading ? '[&>div]:bg-amber-400 [&>div]:animate-pulse' : '[&>div]:bg-amber-500'
              }`}
            />
          </div>

          {templateCount < maxCards && !isUploading && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                {`还需要上传 ${maxCards - templateCount} 张模板图片才能完整覆盖所有${workMode === 'poker' ? '扑克牌' : '塔罗牌'}位置`}
              </AlertDescription>
            </Alert>
          )}

          {dimensionWarning && !isUploading && (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertDescription>{dimensionWarning}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-green-400 bg-green-50 dark:bg-green-950/30 scale-[1.01]'
              : isUploading
                ? 'border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/10 cursor-wait'
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/20" style={{ animation: 'upload-pulse-ring 1.5s ease-in-out infinite' }} />
                <Loader2 className="size-10 animate-spin text-amber-500" />
              </div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                正在读取并处理模板图片...
              </p>
              <p className="text-xs text-muted-foreground">请稍候，正在解析图片尺寸并排序</p>
            </div>
          ) : (
            <>
              <div className="relative inline-block mb-2">
                <Upload className={`size-7 mx-auto transition-transform duration-300 ${isDragOver ? 'text-green-500 scale-110 -translate-y-1' : 'text-muted-foreground'}`} />
                {isDragOver && (
                  <div className="absolute -top-1 -right-1 size-4 rounded-full bg-green-500 flex items-center justify-center" style={{ animation: 'upload-success-check 0.4s ease forwards' }}>
                    <CheckCircle2 className="size-3 text-white" />
                  </div>
                )}
              </div>
              <p className={`text-sm transition-colors ${isDragOver ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                {isDragOver ? '松开鼠标上传模板' : `拖拽或选择 ${maxCards} 张模板图片（按文件名数字排序）`}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                支持所有图片格式，建议统一尺寸（如 750×1334）
              </p>
            </>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/50">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />{`文件名含数字自动排序匹配（1-${maxCards}）`}</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />重新上传将覆盖已有模板</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />建议 PNG 格式保留透明度</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {/* Single image apply to all */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 w-full border-purple-400/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-400/60"
              onClick={() => !isUploading && singleFileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {isUploading ? '处理中...' : `使用单张图片作为全部 ${maxCards} 张模板`}
            </Button>
          </div>
          <input
            ref={singleFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSingleFileChange}
            disabled={isUploading}
          />
        </div>

        {/* Save as template group */}
        {templateCount > 0 && (
          <div className="flex items-center gap-2">
            {showSaveGroup ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="输入模板组名称..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGroup()}
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={handleSaveGroup} disabled={isSavingGroup}>
                  {isSavingGroup ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  {isSavingGroup ? '保存中...' : '保存'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => setShowSaveGroup(false)} disabled={isSavingGroup}>
                  取消
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 w-full border-dashed"
                onClick={() => setShowSaveGroup(true)}
                disabled={isSavingGroup}
              >
                {isSavingGroup ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {isSavingGroup ? '正在保存...' : '保存当前模板为模板组（本地持久化）'}
              </Button>
            )}
          </div>
        )}

        {/* Template grid - {maxCards} positions */}
        <div className="shrink-0">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1">
            {Array.from({ length: maxCards }, (_, i) => i + 1).map((index) => {
              const tpl = templateMap.get(index);
              return (
                <div
                  key={index}
                  className={`upload-item-enter relative group rounded-lg border p-1 transition-colors ${
                    tpl
                      ? 'bg-muted/50 hover:border-primary/30'
                      : 'bg-muted/20 border-dashed border-muted-foreground/20'
                  }`}
                  style={{ animationDelay: `${index * 15}ms`, animationFillMode: 'both' }}
                >
                  {tpl ? (
                    <>
                      <div className="relative aspect-[3/4] rounded overflow-hidden mb-1 checkerboard-sm">
                        <img
                          src={tpl.preview}
                          alt={tpl.file.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-medium text-muted-foreground truncate">
                          #{index} {tpl.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {tpl.width}×{tpl.height}
                        </p>
                      </div>
                      <button
                        onClick={() => removeTemplate(index)}
                        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                      >
                        <X className="size-2.5" />
                      </button>
                    </>
                  ) : (
                    <div className="aspect-[3/4] flex flex-col items-center justify-center text-muted-foreground/40">
                      <span className="text-xs font-medium">#{index}</span>
                      <ImageIcon className="size-3 mt-0.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

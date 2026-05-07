'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { getWorkspaceConfig } from '@/lib/workspace-config';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadDialog({ open, onOpenChange }: ImageUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImages = useAppStore((s) => s.uploadedImages);
  const addImages = useAppStore((s) => s.addImages);
  const removeImage = useAppStore((s) => s.removeImage);
  const clearImages = useAppStore((s) => s.clearImages);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const workMode = useAppStore((s) => s.workMode);
  const maxCards = getWorkspaceConfig(workMode).maxCards;

  const imageCount = uploadedImages.length;
  const progressValue = (imageCount / maxCards) * 100;

  const triggerUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      await addImages(files);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } finally {
      setIsUploading(false);
    }
  }, [addImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      triggerUpload(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleClearAll = () => {
    clearImages();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            图片上传
          </DialogTitle>
          <DialogDescription>
            {`上传${workMode === 'poker' ? '扑克牌' : '塔罗牌'}图片，支持 JPG、PNG、WebP 格式，最多 ${maxCards} 张`}
          </DialogDescription>
        </DialogHeader>

        {/* Stats card */}
        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-zinc-100">
            <span className="flex items-center gap-2">
              {isUploading ? (
                <Loader2 className="size-4 animate-spin text-amber-400" />
              ) : uploadSuccess ? (
                <CheckCircle2 className="size-4 text-green-400" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              {isUploading
                ? '正在处理图片...'
                : uploadSuccess
                  ? `上传完成！已上传 ${imageCount}/${maxCards} 张图片`
                  : `已上传 ${imageCount}/${maxCards} 张图片`}
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

        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
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
                正在读取并处理图片...
              </p>
              <p className="text-xs text-muted-foreground">请稍候，正在解析图片尺寸信息</p>
            </div>
          ) : (
            <>
              <div className="relative inline-block mb-3">
                <Upload className={`size-8 mx-auto transition-transform duration-300 ${isDragOver ? 'text-green-500 scale-110 -translate-y-1' : 'text-muted-foreground'}`} />
                {isDragOver && (
                  <div className="absolute -top-1 -right-1 size-4 rounded-full bg-green-500 flex items-center justify-center" style={{ animation: 'upload-success-check 0.4s ease forwards' }}>
                    <CheckCircle2 className="size-3 text-white" />
                  </div>
                )}
              </div>
              <p className={`text-sm transition-colors ${isDragOver ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                {isDragOver ? '松开鼠标上传图片' : '拖拽图片到此处或点击选择'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                支持 JPG、PNG、WebP 格式，单张建议不超过 10MB
              </p>
            </>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/50">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />建议按文件名数字排序上传</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />支持多选一次性上传</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />最多上传 {maxCards} 张图片</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {/* Image grid */}
        {imageCount > 0 && (
          <div className="shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {uploadedImages.map((img, index) => (
                <div
                  key={img.id}
                  className="upload-item-enter relative group bg-muted/50 rounded-lg p-2 border hover:border-primary/30 transition-colors"
                  style={{ animationDelay: `${Math.min(index * 30, 500)}ms`, animationFillMode: 'both' }}
                >
                  <div className="relative aspect-[3/4] rounded overflow-hidden mb-2 bg-black/5">
                    <img
                      src={img.preview}
                      alt={img.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium truncate">{img.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {img.width} × {img.height} · {formatFileSize(img.size)}
                  </p>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {imageCount > 0 && (
          <DialogFooter className="pt-2 border-t">
            <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={isUploading}>
              <Trash2 className="size-4" />
              清空全部
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

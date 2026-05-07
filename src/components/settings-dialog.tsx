'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Settings, Maximize2, Crop, Plus, X, Bookmark } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { ProcessMode, SizePreset } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const customPresets = useAppStore((s) => s.customPresets);
  const addCustomPreset = useAppStore((s) => s.addCustomPreset);
  const removeCustomPreset = useAppStore((s) => s.removeCustomPreset);
  const { toast } = useToast();

  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleModeChange = (value: string) => {
    updateSettings({ mode: value as ProcessMode });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num) && num > 0 && Number.isInteger(num)) {
      updateSettings({ width: num });
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num) && num > 0 && Number.isInteger(num)) {
      updateSettings({ height: num });
    }
  };

  const isCurrentSize = useCallback(
    (w: number, h: number) => settings.width === w && settings.height === h,
    [settings.width, settings.height]
  );

  const canSavePreset = useMemo(
    () => !customPresets.some(p => isCurrentSize(p.width, p.height)),
    [customPresets, isCurrentSize]
  );

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim() || `自定义 ${customPresets.length + 1}`;
    addCustomPreset(name, settings.width, settings.height);
    setPresetName('');
    setShowSavePreset(false);
    toast({
      title: '预设已保存',
      description: `「${name}」(${settings.width}×${settings.height})`,
    });
  }, [presetName, customPresets.length, settings.width, settings.height, addCustomPreset, toast]);

  const handleDeletePreset = useCallback((preset: SizePreset) => {
    removeCustomPreset(preset.id);
    toast({
      title: '预设已删除',
      description: `「${preset.name}」已移除`,
    });
  }, [removeCustomPreset, toast]);

  // Use a key derived from open state to force input remount
  const inputKey = useMemo(() => (open ? 'open' : 'closed'), [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            处理设置
          </DialogTitle>
          <DialogDescription>
            配置图片处理模式和输出尺寸
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Processing mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">处理模式</Label>
            <RadioGroup
              value={settings.mode}
              onValueChange={handleModeChange}
              className="space-y-2"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer">
                <RadioGroupItem value="stretch" id="mode-stretch" className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor="mode-stretch" className="font-medium cursor-pointer flex items-center gap-2">
                    <Maximize2 className="size-4" />
                    像素缩放
                  </Label>
                  <p className="text-xs text-muted-foreground">直接拉伸到目标尺寸</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer">
                <RadioGroupItem value="crop" id="mode-crop" className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor="mode-crop" className="font-medium cursor-pointer flex items-center gap-2">
                    <Crop className="size-4" />
                    比例缩放
                  </Label>
                  <p className="text-xs text-muted-foreground">等比缩放后居中裁剪</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Output size */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">输出尺寸</Label>
            <div className="flex items-center gap-2" key={inputKey}>
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  defaultValue={settings.width}
                  onChange={handleWidthChange}
                  placeholder="宽度"
                />
              </div>
              <span className="text-muted-foreground font-medium text-sm">x</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  defaultValue={settings.height}
                  onChange={handleHeightChange}
                  placeholder="高度"
                />
              </div>
            </div>

            {/* Save current size as custom preset */}
            {canSavePreset && (
              <div className="mt-2">
                {showSavePreset ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="输入预设名称..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                      className="h-8 text-xs"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={handleSavePreset}>
                      保存
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => { setShowSavePreset(false); setPresetName(''); }}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-dashed w-full"
                    onClick={() => setShowSavePreset(true)}
                  >
                    <Plus className="size-3.5" />
                    将当前尺寸 {settings.width}×{settings.height} 保存为预设
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Custom presets */}
          {customPresets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Bookmark className="size-4 text-purple-500" />
                自定义预设
              </div>
              <div className="flex flex-wrap gap-2">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="group relative inline-flex"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ width: preset.width, height: preset.height })}
                      className={
                        isCurrentSize(preset.width, preset.height)
                          ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400 pr-7'
                          : 'pr-7'
                      }
                    >
                      {preset.name} {preset.width}×{preset.height}
                    </Button>
                    <button
                      onClick={() => handleDeletePreset(preset)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-sm"
                      title="删除此预设"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

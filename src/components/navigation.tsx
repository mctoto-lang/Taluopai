'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppStore } from '@/lib/store';
import { getWorkspaceConfig } from '@/lib/workspace-config';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { WorkMode } from '@/types';

interface NavigationProps {
  onOpenUpload: () => void;
  onOpenTemplates: () => void;
  onOpenCardTemplates: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
  boundCount: number;
  uploadedCount: number;
  templateCount: number;
  maxCards: number;
}

const navItems = [
  { icon: '/nav-home.gif', label: '首页', action: 'scroll-top' as const },
  { icon: '/nav-upload.gif', label: '图片上传', action: 'upload' as const },
  { icon: '/nav-templates.gif', label: '模板管理', action: 'templates' as const },
  { icon: '/nav-templates-cards.gif', label: '卡牌模板', action: 'card-templates' as const },
  { icon: '/nav-settings.gif', label: '处理设置', action: 'settings' as const },
  { icon: '/nav-export.gif', label: '导出牌组', action: 'export' as const },
];

function StatBadge({ label, value, max }: { label: string; value: number; max: number }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {value}/{max}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}: {value}/{max}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={cn(
        'font-semibold',
        value === max ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
      )}>
        {value}
      </span>
      <span className="text-gray-400 dark:text-gray-500">/</span>
      <span className="text-gray-500 dark:text-gray-400">{max}</span>
    </span>
  );
}

export function Navigation({
  onOpenUpload,
  onOpenTemplates,
  onOpenCardTemplates,
  onOpenSettings,
  onExport,
  boundCount,
  uploadedCount,
  templateCount,
  maxCards,
}: NavigationProps) {
  const isMobile = useIsMobile();
  const workMode = useAppStore(s => s.workMode);
  const setWorkMode = useAppStore(s => s.setWorkMode);
  const workspaceConfig = getWorkspaceConfig(workMode);

  const handleAction = (action: typeof navItems[number]['action']) => {
    switch (action) {
      case 'scroll-top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'upload':
        onOpenUpload();
        break;
      case 'templates':
        onOpenTemplates();
        break;
      case 'card-templates':
        onOpenCardTemplates();
        break;
      case 'settings':
        onOpenSettings();
        break;
      case 'export':
        onExport();
        break;
    }
  };

  const handleSwitchMode = (mode: WorkMode) => {
    if (mode !== workMode) {
      setWorkMode(mode);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent dark:via-purple-500/60" />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
            {/* Logo / Workspace Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button suppressHydrationWarning className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200">
                  <span className="text-xl sm:text-2xl">{workspaceConfig.emoji}</span>
                  {!isMobile && (
                    <>
                      <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-700 via-purple-600 to-amber-600 bg-clip-text text-transparent whitespace-nowrap tracking-wide">
                        {workspaceConfig.label}
                      </h1>
                      <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleSwitchMode('tarot')}
                  className={cn(
                    'cursor-pointer',
                    workMode === 'tarot' && 'bg-purple-50 dark:bg-purple-950/50'
                  )}
                >
                  <span className="mr-2">🔮</span>
                  塔罗牌工作台
                  {workMode === 'tarot' && (
                    <span className="ml-auto text-xs text-purple-600 dark:text-purple-400">当前</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSwitchMode('poker')}
                  className={cn(
                    'cursor-pointer',
                    workMode === 'poker' && 'bg-purple-50 dark:bg-purple-950/50'
                  )}
                >
                  <span className="mr-2">🃏</span>
                  扑克牌工作台
                  {workMode === 'poker' && (
                    <span className="ml-auto text-xs text-purple-600 dark:text-purple-400">当前</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => (
                <Tooltip key={item.action}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isMobile ? 'icon' : 'sm'}
                      onClick={() => handleAction(item.action)}
                      className={cn(
                        'text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all duration-200',
                        isMobile && 'h-9 w-9'
                      )}
                    >
                      <span className={cn('text-sm', !isMobile && 'mr-1.5')}>
                        <img src={item.icon} alt={item.label} className="size-4 object-contain" draggable={false} />
                      </span>
                      {!isMobile && (
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <StatBadge label="已绑定" value={boundCount} max={maxCards} />
              <StatBadge label="已上传" value={uploadedCount} max={maxCards} />
              <StatBadge label="模板" value={templateCount} max={maxCards} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CardLoader } from '@/components/card-loader';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  Trash2,
  Pencil,
  Lock,
  Upload,
  Tag,
  ImageIcon,
  Link,
  ImagePlus,
  FileImage,
  Palette,
  Search,
  Filter,
  RefreshCw,
  Cloud,
  Monitor,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// --- Types ---
interface TemplateItem {
  id: string;
  filename: string;
  displayName: string;
  group: string;
  tagText: string;
  tagColor: string;
  uploadedAt: number;
  source?: 'local' | 'url';
  originalUrl?: string;
  hasLocalFile?: boolean;
}

interface TemplateGroup {
  name: string;
  items: TemplateItem[];
}

const PAGE_SIZE = 8;

const TemplateCard = memo(function TemplateCard({
  item,
  getImageUrl,
  adminMode,
  onOpenViewer,
  onEdit,
  onDelete,
  onDownload,
}: {
  item: TemplateItem;
  getImageUrl: (item: TemplateItem) => string;
  adminMode: boolean;
  onOpenViewer: (item: TemplateItem) => void;
  onEdit: (item: TemplateItem) => void;
  onDelete: (item: TemplateItem) => void;
  onDownload: (item: TemplateItem) => void;
}) {
  return (
    <div
      className="group/card relative rounded-lg border bg-white dark:bg-gray-900 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => onOpenViewer(item)}
    >
      <div className="relative aspect-[5/7] bg-gray-50 dark:bg-gray-800">
        <img
          src={getImageUrl(item)}
          alt={item.displayName}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        {item.tagText && (
          <Badge
            className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 border"
            style={{
              backgroundColor: item.tagColor,
              color: item.tagColor === '#FFFFFF' ? '#000' : item.tagColor === '#000000' ? '#fff' : '#fff',
              borderColor: item.tagColor === '#FFFFFF' ? '#d1d5db' : 'transparent',
            }}
          >
            {item.tagText}
          </Badge>
        )}
        <Badge
          variant="secondary"
          className="absolute bottom-1.5 left-1.5 text-[8px] px-1.5 py-0 bg-gray-800/60 text-white/80 border-0 backdrop-blur-sm"
        >
          {item.group}
        </Badge>
        {adminMode && (
          <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors">
              <Pencil className="size-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="p-1 rounded bg-black/60 text-white hover:bg-red-600 transition-colors">
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(item); }}
            className="flex items-center justify-center gap-1 w-full py-1.5 rounded bg-white/90 dark:bg-gray-800/90 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="size-3.5" />
            下载
          </button>
        </div>
      </div>
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium truncate text-center">{item.displayName}</p>
      </div>
    </div>
  );
});

// --- 24 preset tag colors ---
const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#78716C', '#64748B', '#475569',
  '#1E293B', '#FFFFFF', '#000000', '#A3A3A3',
];

const COLOR_NAMES: Record<string, string> = {
  '#EF4444': '红色', '#F97316': '橙色', '#F59E0B': '琥珀',
  '#EAB308': '黄色', '#84CC16': '青柠', '#22C55E': '绿色',
  '#10B981': '翡翠', '#14B8A6': '青色', '#06B6D4': '天蓝',
  '#0EA5E9': '蓝蓝', '#3B82F6': '蓝色', '#6366F1': '靛蓝',
  '#8B5CF6': '紫色', '#A855F7': '紫罗兰', '#D946EF': '品红',
  '#EC4899': '粉色', '#F43F5E': '玫红', '#78716C': '石色',
  '#64748B': '板岩', '#475569': '深灰', '#1E293B': '墨灰',
  '#FFFFFF': '白色', '#000000': '黑色', '#A3A3A3': '灰色',
};

// --- Component ---
export function CardTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();

  // Data
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [allItems, setAllItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchText, setSearchText] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('__all__');
  const [filterTag, setFilterTag] = useState<string>('__all__');
  const [currentPage, setCurrentPage] = useState(1);

  // Viewer
  const [viewerItem, setViewerItem] = useState<TemplateItem | null>(null);
  const [viewerList, setViewerList] = useState<TemplateItem[]>([]);

  // Admin
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  // Upload panel active tab
  const [uploadTab, setUploadTab] = useState<'local' | 'url'>('local');

  // Common upload settings
  const [uploadGroup, setUploadGroup] = useState('未分组');
  const [uploadTagText, setUploadTagText] = useState('');
  const [uploadTagColor, setUploadTagColor] = useState('#64748B');

  // Local upload
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDisplayNames, setUploadDisplayNames] = useState<Record<number, string>>({});

  // URL import
  const [urlInput, setUrlInput] = useState('');
  const [urlDisplayNames, setUrlDisplayNames] = useState<Record<number, string>>({});
  const [urlPreviewList, setUrlPreviewList] = useState<{ url: string; displayName: string }[]>([]);

  const [uploading, setUploading] = useState(false);

  // Tag editor
  const [editingTag, setEditingTag] = useState<TemplateItem | null>(null);
  const [editTagText, setEditTagText] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editImageTab, setEditImageTab] = useState<'local' | 'url'>('local');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Cache buster for image refresh
  const [cacheBuster, setCacheBuster] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isPostRefresh, setIsPostRefresh] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Derived: unique tags from all items ---
  const uniqueTags = useMemo(() => {
    const tagMap = new Map<string, { text: string; color: string }>();
    for (const item of allItems) {
      if (item.tagText && !tagMap.has(item.tagText)) {
        tagMap.set(item.tagText, { text: item.tagText, color: item.tagColor });
      }
    }
    return Array.from(tagMap.values());
  }, [allItems]);

  // --- Derived: filtered items ---
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Filter by group
    if (filterGroup !== '__all__') {
      items = items.filter((i) => i.group === filterGroup);
    }

    // Filter by tag
    if (filterTag !== '__all__') {
      items = items.filter((i) => i.tagText === filterTag);
    }

    // Search by name
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter((i) =>
        i.displayName.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q) ||
        i.tagText.toLowerCase().includes(q),
      );
    }

    return items;
  }, [allItems, filterGroup, filterTag, searchText]);

  // --- Derived: pagination ---
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchText, filterGroup, filterTag]);

  // Fetch data
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      const params = forceRefresh ? '?refresh=1' : '';
      const res = await fetch(`/api/card-templates${params}`);
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      const groupList: TemplateGroup[] = Object.entries(data.groups || {}).map(
        ([name, items]) => ({ name, items: items as TemplateItem[] })
      );
      groupList.sort((a, b) => {
        if (a.name === '未分组') return 1;
        if (b.name === '未分组') return -1;
        return 0;
      });
      setGroups(groupList);
      setAllItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setIsPostRefresh(false);
      fetchData();
      setViewerItem(null);
      setShowUploadPanel(false);
      setSearchText('');
      setFilterGroup('__all__');
      setFilterTag('__all__');
      setCurrentPage(1);
    }
  }, [open, fetchData]);

  // Reset admin on close
  useEffect(() => {
    if (!open) {
      setAdminMode(false);
      setClickCount(0);
      setShowPassword(false);
      setPasswordInput('');
    }
  }, [open]);

  // --- Admin activation: 8 clicks ---
  const handleSecretClick = useCallback(() => {
    if (adminMode) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setClickCount(0), 2000);
    if (newCount >= 8) {
      setClickCount(0);
      setShowPassword(true);
    }
  }, [clickCount, adminMode]);

  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === '2358153409') {
      setAdminMode(true);
      setShowPassword(false);
      setPasswordInput('');
      toast({ title: '管理模式已激活' });
    } else {
      toast({ title: '密码错误', variant: 'destructive' });
      setPasswordInput('');
    }
  }, [passwordInput, toast]);

  // --- Common settings ---
  const resetUploadForm = useCallback(() => {
    setUploadFiles([]);
    setUploadDisplayNames({});
    setUrlInput('');
    setUrlPreviewList([]);
    setUrlDisplayNames({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // --- URL input parsing ---
  const parseUrlInput = useCallback(() => {
    const lines = urlInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && (s.startsWith('http://') || s.startsWith('https://')));
    setUrlPreviewList(lines.map((url) => ({ url, displayName: '' })));
    setUrlDisplayNames({});
  }, [urlInput]);

  // --- Upload ---
  const compressImage = useCallback((file: File, maxSize = 1200): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.size < 200 * 1024) {
        resolve(file);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: file.type })),
          file.type,
          0.85,
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleLocalUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      const compressed = await Promise.all(uploadFiles.map((f) => compressImage(f)));
      compressed.forEach((f) => fd.append('files', f));
      fd.append('group', uploadGroup);
      fd.append('tagText', uploadTagText);
      fd.append('tagColor', uploadTagColor);
      const names: string[] = uploadFiles.map((_, i) => uploadDisplayNames[i] || '');
      fd.append('displayNames', JSON.stringify(names));

      const res = await fetch('/api/card-templates', { method: 'POST', body: fd });
      if (!res.ok) {
        let errorMsg = `上传失败 (HTTP ${res.status})`;
        try { const result = await res.json(); errorMsg = result.error || result.details || errorMsg; }
        catch { try { errorMsg = await res.text(); } catch { /* ignore */ } }
        throw new Error(errorMsg);
      }
      await res.json();
      toast({ title: `成功上传 ${uploadFiles.length} 张图片` });
      resetUploadForm();
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '上传失败';
      console.error('[CardTemplate upload error]', msg);
      toast({ title: '上传失败', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [uploadFiles, uploadGroup, uploadTagText, uploadTagColor, uploadDisplayNames, fetchData, toast, compressImage, resetUploadForm]);

  const handleUrlImport = useCallback(async () => {
    if (urlPreviewList.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      const urls = urlPreviewList.map((_, i) => urlDisplayNames[i] || '');
      fd.append('urls', JSON.stringify(urlPreviewList.map((p) => p.url)));
      fd.append('group', uploadGroup);
      fd.append('tagText', uploadTagText);
      fd.append('tagColor', uploadTagColor);
      fd.append('displayNames', JSON.stringify(urls));

      const res = await fetch('/api/card-templates', { method: 'POST', body: fd });
      if (!res.ok) {
        let errorMsg = `导入失败 (HTTP ${res.status})`;
        try { const result = await res.json(); errorMsg = result.error || result.details || errorMsg; }
        catch { try { errorMsg = await res.text(); } catch { /* ignore */ } }
        throw new Error(errorMsg);
      }
      const result = await res.json();
      const imported = result.imported || result.items?.length || 0;
      const total = result.total || urlPreviewList.length;
      toast({
        title: `成功导入 ${imported} / ${total} 张图片`,
        description: imported < total ? '部分链接导入失败' : undefined,
      });
      resetUploadForm();
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '导入失败';
      console.error('[CardTemplate URL import error]', msg);
      toast({ title: '导入失败', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [urlPreviewList, urlDisplayNames, uploadGroup, uploadTagText, uploadTagColor, fetchData, toast, resetUploadForm]);

  // --- Delete ---
  const handleDelete = useCallback(async (item: TemplateItem) => {
    try {
      const res = await fetch(`/api/card-templates/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: `已删除「${item.displayName}」` });
      fetchData();
    } catch {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  }, [fetchData, toast]);

  // --- Tag edit ---
  const openTagEditor = useCallback((item: TemplateItem) => {
    setEditingTag(item);
    setEditTagText(item.tagText);
    setEditTagColor(item.tagColor);
    setEditDisplayName(item.displayName);
    setEditImageTab('local');
    setEditImageFile(null);
    setEditImagePreview('');
    setEditImageUrl('');
  }, []);

  const handleEditImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }, []);

  const saveTagEdit = useCallback(async () => {
    if (!editingTag) return;
    setEditSaving(true);
    try {
      const hasNewImage = editImageFile || (editImageTab === 'url' && editImageUrl.trim());

      if (hasNewImage) {
        const fd = new FormData();
        if (editImageFile) {
          fd.append('file', editImageFile);
        } else if (editImageTab === 'url' && editImageUrl.trim()) {
          fd.append('imageUrl', editImageUrl.trim());
        }
        fd.append('tagText', editTagText);
        fd.append('tagColor', editTagColor);
        fd.append('displayName', editDisplayName);
        const res = await fetch(`/api/card-templates/${editingTag.id}`, { method: 'PATCH', body: fd });
        if (!res.ok) {
          let errorMsg = '保存失败';
          try { const result = await res.json(); errorMsg = result.error || errorMsg; } catch { /* ignore */ }
          throw new Error(errorMsg);
        }
      } else {
        // Metadata only update
        const res = await fetch(`/api/card-templates/${editingTag.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagText: editTagText, tagColor: editTagColor, displayName: editDisplayName }),
        });
        if (!res.ok) throw new Error();
      }
      // Bump cache buster to refresh image
      setCacheBuster((v) => v + 1);
      toast({ title: '已保存修改' });
      setEditingTag(null);
      setEditImageFile(null);
      setEditImageUrl('');
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
      setEditImagePreview('');
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败';
      toast({ title: '保存失败', description: msg, variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  }, [editingTag, editTagText, editTagColor, editDisplayName, editImageFile, editImageTab, editImageUrl, editImagePreview, fetchData, toast]);

  // --- Viewer navigation ---
  const openViewer = useCallback((item: TemplateItem) => {
    setViewerItem(item);
    setViewerList(filteredItems);
  }, [filteredItems]);

  const navigateViewer = useCallback((dir: -1 | 1) => {
    if (!viewerItem) return;
    const idx = viewerList.findIndex((i) => i.id === viewerItem.id);
    const next = (idx + dir + viewerList.length) % viewerList.length;
    setViewerItem(viewerList[next]);
  }, [viewerItem, viewerList]);

  const downloadImage = useCallback(async (item: TemplateItem) => {
    try {
      const res = await fetch(`/api/card-templates/file/${encodeURIComponent(item.filename)}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.displayName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: '下载失败', variant: 'destructive' });
    }
  }, [toast]);

  const getImageUrl = useCallback((item: TemplateItem) => {
    if (item.source === 'url' && item.originalUrl) {
      return item.originalUrl;
    }
    if (!item.filename) {
      console.error('[getImageUrl] Missing filename for item:', item);
      return '';
    }
    return `/api/card-templates/file/${encodeURIComponent(item.filename)}?v=${cacheBuster}`;
  }, [cacheBuster]);

  // --- Refresh: re-download URL images from network & bust browser cache ---
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear browser Cache API
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
        }
      }
      // Re-fetch metadata with ?refresh=1 → server re-downloads all URL-sourced images
      await fetchData(true);
      // Increment cache buster to force browser reload all images
      setCacheBuster((v) => v + 1);
      // Mark post-refresh state so URL images show cloud origin
      setIsPostRefresh(true);
      toast({ title: '已刷新图片资源' });
    } catch {
      toast({ title: '刷新失败', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, toast]);

  // --- Pagination page range ---
  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (current > 3) pages.push('ellipsis');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('ellipsis');
    pages.push(total);
    return pages;
  };

  // --- Color Picker Component ---
  const ColorPickerPopover = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (color: string) => void;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full">
          <div
            className="w-5 h-5 rounded-md border shadow-sm shrink-0"
            style={{ backgroundColor: value, borderColor: value === '#FFFFFF' ? '#d1d5db' : 'transparent' }}
          />
          <span className="text-sm text-muted-foreground flex-1 text-left truncate">{COLOR_NAMES[value] || value}</span>
          <Palette className="size-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-8 gap-1.5">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                'h-7 w-7 rounded-md border-2 transition-all hover:scale-110',
                value === c ? 'border-purple-500 ring-2 ring-purple-300 scale-110' : 'border-gray-200 dark:border-gray-600',
              )}
              style={{ backgroundColor: c }}
              title={COLOR_NAMES[c] || c}
            />
          ))}
        </div>
        {uploadTagText && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">预览:</span>
            <Badge
              className="text-[10px] px-1.5 py-0 border"
              style={{
                backgroundColor: value,
                color: value === '#FFFFFF' ? '#000' : value === '#000000' ? '#fff' : '#fff',
                borderColor: value === '#FFFFFF' ? '#d1d5db' : 'transparent',
              }}
            >
              {uploadTagText}
            </Badge>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  // --- Card component ---
  const handleOpenViewer = useCallback((item: TemplateItem) => {
    openViewer(item);
  }, [openViewer]);

  const handleEdit = useCallback((item: TemplateItem) => {
    openTagEditor(item);
  }, [openTagEditor]);

  const handleDeleteItem = useCallback((item: TemplateItem) => {
    handleDelete(item);
  }, [handleDelete]);

  const handleDownloadItem = useCallback((item: TemplateItem) => {
    downloadImage(item);
  }, [downloadImage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="shrink-0 px-8 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <img src="/nav-templates-cards.gif" alt="" className="size-6 object-contain" draggable={false} />
              卡牌模板
              <button onClick={handleSecretClick} className="ml-1 opacity-30 hover:opacity-70 transition-opacity cursor-pointer" title="">
                <Lock className="size-3.5" />
              </button>
            </DialogTitle>
            {adminMode && (
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                  管理模式
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUploadPanel(!showUploadPanel)}
                  className="h-7 gap-1 text-xs"
                >
                  <ImagePlus className="size-3.5" />
                  {showUploadPanel ? '收起' : '添加图片'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
          {/* Password modal overlay */}
          {showPassword && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl w-80 space-y-4">
                <h3 className="font-semibold text-center">输入管理密码</h3>
                <Input type="password" placeholder="请输入密码" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} autoFocus />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowPassword(false); setPasswordInput(''); }}>取消</Button>
                  <Button className="flex-1" onClick={handlePasswordSubmit}>确认</Button>
                </div>
              </div>
            </div>
          )}

          {/* Upload panel */}
          {adminMode && showUploadPanel && (
            <div className="mb-5 mt-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-950/30 dark:to-gray-900 overflow-hidden">
              <div className="flex border-b border-purple-200/60 dark:border-purple-800/60">
                <button onClick={() => setUploadTab('local')} className={cn('flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors relative', uploadTab === 'local' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200')}>
                  <Upload className="size-4" />本地上传
                  {uploadTab === 'local' && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />}
                </button>
                <button onClick={() => setUploadTab('url')} className={cn('flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors relative', uploadTab === 'url' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200')}>
                  <Link className="size-4" />网络链接
                  {uploadTab === 'url' && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />}
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">所属分组</Label>
                    <Input value={uploadGroup} onChange={(e) => setUploadGroup(e.target.value)} placeholder="输入分组名称" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">标签文字</Label>
                    <Input value={uploadTagText} onChange={(e) => setUploadTagText(e.target.value)} placeholder="可选" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">标签颜色</Label>
                    <ColorPickerPopover value={uploadTagColor} onChange={setUploadTagColor} />
                  </div>
                </div>
                {uploadTab === 'local' ? (
                  <div className="space-y-3">
                    <div onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-6 cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors group">
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setUploadFiles(files); const names: Record<number, string> = {}; files.forEach((f, i) => { names[i] = f.name.replace(/\.[^.]+$/, ''); }); setUploadDisplayNames(names); }} className="hidden" />
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors"><FileImage className="size-6 text-purple-500 dark:text-purple-400" /></div>
                        <p className="text-sm font-medium">{uploadFiles.length > 0 ? `已选择 ${uploadFiles.length} 张图片` : '点击选择图片或拖拽至此'}</p>
                        <p className="text-xs text-muted-foreground/60">支持 PNG、JPG、GIF、WebP 格式</p>
                      </div>
                    </div>
                    {uploadFiles.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">自定义显示名称</Label>
                        <div className="max-h-36 overflow-y-auto rounded-lg border bg-white dark:bg-gray-900 divide-y dark:divide-gray-800">
                          {uploadFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                              <span className="text-[10px] font-mono text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                              <div className="w-7 h-7 rounded bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden"><img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" /></div>
                              <Input value={uploadDisplayNames[i] || ''} onChange={(e) => setUploadDisplayNames((prev) => ({ ...prev, [i]: e.target.value }))} placeholder={f.name} className="h-7 text-xs flex-1" />
                              <span className="text-[10px] text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={handleLocalUpload} disabled={uploadFiles.length === 0 || uploading} className="gap-1.5" size="sm">
                        {uploading ? (<><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />上传中...</>) : (<><Upload className="size-3.5" />上传 {uploadFiles.length > 0 ? `${uploadFiles.length} 张图片` : ''}</>)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">图片链接<span className="text-muted-foreground/50 ml-1">（每行一个，支持批量）</span></Label>
                      <textarea value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder={"https://example.com/image1.png\nhttps://example.com/image2.jpg"} className="w-full min-h-[80px] max-h-[200px] rounded-lg border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 placeholder:text-muted-foreground/40" rows={3} />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={parseUrlInput} disabled={!urlInput.trim()} className="gap-1.5 text-xs"><Link className="size-3.5" />解析链接</Button>
                    </div>
                    {urlPreviewList.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">待导入图片（{urlPreviewList.length} 张）</Label>
                        <div className="max-h-48 overflow-y-auto rounded-lg border bg-white dark:bg-gray-900 divide-y dark:divide-gray-800">
                          {urlPreviewList.map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                              <span className="text-[10px] font-mono text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                              <div className="w-7 h-7 rounded bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden"><img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>
                              <Input value={urlDisplayNames[i] || ''} onChange={(e) => setUrlDisplayNames((prev) => ({ ...prev, [i]: e.target.value }))} placeholder={item.url.split('/').pop() || `图片 ${i + 1}`} className="h-7 text-xs flex-1" />
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-purple-500 transition-colors shrink-0" title="打开链接"><Link className="size-3.5" /></a>
                              <button onClick={() => { setUrlPreviewList((prev) => prev.filter((_, idx) => idx !== i)); setUrlDisplayNames((prev) => { const next: Record<number, string> = {}; Object.entries(prev).forEach(([k, v]) => { const ki = parseInt(k); if (ki < i) next[ki] = v; if (ki > i) next[ki - 1] = v; }); return next; }); }} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0" title="移除"><X className="size-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={handleUrlImport} disabled={urlPreviewList.length === 0 || uploading} className="gap-1.5" size="sm">
                        {uploading ? (<><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />导入中...</>) : (<><ImagePlus className="size-3.5" />导入 {urlPreviewList.length > 0 ? `${urlPreviewList.length} 张图片` : ''}</>)}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CardLoader className="text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <ImageIcon className="size-12 opacity-30" />
              <p className="text-sm">暂无卡牌模板</p>
              {adminMode && (
                <Button variant="outline" size="sm" onClick={() => setShowUploadPanel(true)}>
                  <Plus className="size-4 mr-1" /> 添加图片
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* === Toolbar: Search + Filters === */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search — takes remaining space */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索名称、分组、标签..."
                    className="pl-9 h-9 text-sm"
                  />
                  {searchText && (
                    <button
                      onClick={() => setSearchText('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter: Group */}
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger size="sm" className="w-auto min-w-[130px] h-9 text-sm">
                    <Filter className="size-3.5 text-muted-foreground mr-1" />
                    <SelectValue placeholder="筛选分组" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      <span className="flex items-center gap-1.5">全部分组</span>
                    </SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                      {groups.map((g) => (
                        <SelectItem key={g.name} value={g.name}>
                          <span className="flex items-center gap-1.5">
                            <span>{g.name}</span>
                            <span className="text-muted-foreground text-[10px]">({g.items.length})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Filter: Tag */}
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger size="sm" className="w-auto min-w-[130px] h-9 text-sm">
                    <Tag className="size-3.5 text-muted-foreground mr-1" />
                    <SelectValue placeholder="筛选标签" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      <span className="flex items-center gap-1.5">全部标签</span>
                    </SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                      {uniqueTags.map((t) => (
                        <SelectItem key={t.text} value={t.text}>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm shrink-0 inline-block" style={{ backgroundColor: t.color }} />
                            <span>{t.text}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Refresh button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  title="刷新图片资源"
                  className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-black text-white hover:bg-black/85 active:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
                </button>
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  共 {filteredItems.length} 张模板
                  {(filterGroup !== '__all__' || filterTag !== '__all__' || searchText.trim()) && (
                    <button onClick={() => { setFilterGroup('__all__'); setFilterTag('__all__'); setSearchText(''); }} className="ml-2 text-purple-500 hover:text-purple-600 transition-colors">
                      清除筛选
                    </button>
                  )}
                </span>
                {totalPages > 1 && (
                  <span>第 {currentPage} / {totalPages} 页</span>
                )}
              </div>

              {/* === Card Grid === */}
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Search className="size-8 opacity-30" />
                  <p className="text-sm">未找到匹配的模板</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pagedItems.map((item) => (
                    <TemplateCard
                      key={item.id}
                      item={item}
                      getImageUrl={getImageUrl}
                      adminMode={adminMode}
                      onOpenViewer={handleOpenViewer}
                      onEdit={handleEdit}
                      onDelete={handleDeleteItem}
                      onDownload={handleDownloadItem}
                    />
                  ))}
                </div>
              )}

              {/* === Pagination === */}
              {totalPages > 1 && (
                <Pagination className="pt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={cn('gap-1 text-xs cursor-pointer', currentPage <= 1 && 'pointer-events-none opacity-50')}
                      >
                        上一页
                      </PaginationPrevious>
                    </PaginationItem>

                    {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page as number)}
                            className="cursor-pointer text-xs"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={cn('gap-1 text-xs cursor-pointer', currentPage >= totalPages && 'pointer-events-none opacity-50')}
                      >
                        下一页
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>

        {/* Image Viewer overlay — Portal */}
        {viewerItem && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <button onClick={() => setViewerItem(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="size-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); navigateViewer(-1); }} className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><ChevronLeft className="size-6" /></button>
            <div className="relative z-[1] max-h-[85vh] max-w-[85vw] flex flex-col items-center">
              {viewerItem.tagText && (
                <Badge className="absolute top-3 right-3 text-xs px-2 py-1 border z-10" style={{ backgroundColor: viewerItem.tagColor, color: viewerItem.tagColor === '#FFFFFF' ? '#000' : viewerItem.tagColor === '#000000' ? '#fff' : '#fff', borderColor: viewerItem.tagColor === '#FFFFFF' ? '#d1d5db' : 'transparent' }}>
                  {viewerItem.tagText}
                </Badge>
              )}
              <img src={getImageUrl(viewerItem)} alt={viewerItem.displayName} className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg" />
              <p className="mt-3 text-sm text-white/80 font-medium">{viewerItem.displayName}</p>
              <p className="text-xs text-white/50 mt-0.5">{viewerList.findIndex((i) => i.id === viewerItem.id) + 1} / {viewerList.length}</p>
              {/* Source indicator */}
              <p className="flex items-center gap-1 mt-1 text-[11px] text-white/40">
                {(() => {
                  const isFromCloud = viewerItem.source === 'url' && (!viewerItem.hasLocalFile || isPostRefresh);
                  return isFromCloud ? (
                    <><Cloud className="size-3" /><span>图片加载于云端服务器</span></>
                  ) : (
                    <><Monitor className="size-3" /><span>图片加载于浏览器缓存</span></>
                  );
                })()}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigateViewer(1); }} className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><ChevronRight className="size-6" /></button>
          </div>,
          document.body,
        )}

        {/* Card editor overlay */}
        {editingTag && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-2xl w-[420px] space-y-4">
              <h3 className="font-semibold flex items-center gap-1.5"><Pencil className="size-4" /> 编辑卡片</h3>

              {/* Current image preview */}
              <div className="space-y-1.5">
                <Label className="text-xs">当前图片</Label>
                <div className="relative w-full aspect-[5/7] max-h-[160px] rounded-lg border bg-gray-50 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={editImagePreview || getImageUrl(editingTag)}
                    alt={editingTag.displayName}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Replace image */}
              <div className="space-y-1.5">
                <Label className="text-xs">替换图片</Label>
                {/* Tab bar: local / url */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => { setEditImageTab('local'); setEditImageFile(null); setEditImagePreview(''); }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 flex-1 py-1.5 text-xs font-medium transition-colors',
                      editImageTab === 'local'
                        ? 'bg-black text-white'
                        : 'bg-white dark:bg-gray-900 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Upload className="size-3" />本地上传
                  </button>
                  <button
                    onClick={() => { setEditImageTab('url'); setEditImageFile(null); if (editImagePreview) URL.revokeObjectURL(editImagePreview); setEditImagePreview(''); setEditImageUrl(''); }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 flex-1 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700',
                      editImageTab === 'url'
                        ? 'bg-black text-white'
                        : 'bg-white dark:bg-gray-900 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Link className="size-3" />网络链接
                  </button>
                </div>
                {editImageTab === 'local' ? (
                  <div>
                    <div
                      onClick={() => document.getElementById('edit-image-input')?.click()}
                      className="flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs text-muted-foreground"
                    >
                      {editImageFile ? (
                        <>
                          <FileImage className="size-3.5 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">已选择: {editImageFile.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditImageFile(null); if (editImagePreview) URL.revokeObjectURL(editImagePreview); setEditImagePreview(''); }}
                            className="ml-auto p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="size-3.5" />
                          点击选择新图片（可选）
                        </>
                      )}
                    </div>
                    <input
                      id="edit-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditImageSelect}
                    />
                  </div>
                ) : (
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="输入图片网络链接，如 https://example.com/image.png"
                    className="h-8 text-xs"
                  />
                )}
              </div>

              {/* Display name */}
              <div className="space-y-1.5">
                <Label className="text-xs">显示名称</Label>
                <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="h-8 text-sm" />
              </div>

              {/* Tag text */}
              <div className="space-y-1.5">
                <Label className="text-xs">标签文字</Label>
                <Input value={editTagText} onChange={(e) => setEditTagText(e.target.value)} placeholder="输入标签文字" className="h-8 text-sm" />
              </div>

              {/* Tag color */}
              <div className="space-y-1.5">
                <Label className="text-xs">标签颜色</Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {TAG_COLORS.map((c) => (
                    <button key={c} onClick={() => setEditTagColor(c)} className={cn('h-7 w-7 rounded-md border-2 transition-transform hover:scale-110', editTagColor === c ? 'border-purple-500 ring-1 ring-purple-300 scale-110' : 'border-gray-200 dark:border-gray-700')} style={{ backgroundColor: c }} title={COLOR_NAMES[c] || c} />
                  ))}
                </div>
                {editTagText && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">预览:</span>
                    <Badge className="text-[10px] px-1.5 py-0 border" style={{ backgroundColor: editTagColor, color: editTagColor === '#FFFFFF' ? '#000' : editTagColor === '#000000' ? '#fff' : '#fff', borderColor: editTagColor === '#FFFFFF' ? '#d1d5db' : 'transparent' }}>{editTagText}</Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setEditingTag(null); setEditImageFile(null); if (editImagePreview) URL.revokeObjectURL(editImagePreview); setEditImagePreview(''); }}>取消</Button>
                <Button className="flex-1" onClick={saveTagEdit} disabled={editSaving}>
                  {editSaving ? (<><span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>) : '保存'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

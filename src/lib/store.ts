import { create } from 'zustand';
import { UploadedImage, TemplateImage, ProcessSettings, TarotCard, TemplateGroupMeta, SizePreset, WorkMode } from '@/types';
import { TAROT_CARDS } from '@/lib/tarot-data';
import { POKER_CARDS } from '@/lib/poker-data';
import { getWorkspaceConfig } from '@/lib/workspace-config';
import { v4 as uuidv4 } from 'uuid';
import { idbSet, idbGet, idbDelete, imageToDataUrl, loadImage } from '@/lib/idb';

const STORAGE_SETTINGS_KEY = 'tarot-settings';
const STORAGE_TEMPLATE_GROUPS_KEY = 'tarot-template-groups';
const STORAGE_SIZE_PRESETS_KEY = 'tarot-size-presets';
const STORAGE_WORK_MODE_KEY = 'card-work-mode';

// --- localStorage helpers ---

function loadWorkMode(): WorkMode {
  if (typeof window === 'undefined') return 'tarot';
  try {
    const raw = localStorage.getItem(STORAGE_WORK_MODE_KEY);
    if (raw === 'poker') return 'poker';
  } catch { /* ignore */ }
  return 'tarot';
}

function saveWorkMode(mode: WorkMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_WORK_MODE_KEY, mode);
  } catch { /* ignore */ }
}

function loadSettings(): ProcessSettings {
  if (typeof window === 'undefined') return { mode: 'crop', width: 1210, height: 2146 };
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.mode && parsed.width > 0 && parsed.height > 0) return parsed;
    }
  } catch { /* ignore */ }
  return { mode: 'crop', width: 1210, height: 2146 };
}

function saveSettings(settings: ProcessSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

function loadSizePresets(): SizePreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SIZE_PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveSizePresets(presets: SizePreset[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SIZE_PRESETS_KEY, JSON.stringify(presets));
  } catch { /* ignore */ }
}

function loadTemplateGroups(): TemplateGroupMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_TEMPLATE_GROUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveTemplateGroups(groups: TemplateGroupMeta[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_TEMPLATE_GROUPS_KEY, JSON.stringify(groups));
  } catch { /* ignore */ }
}

// --- Image dimension loader ---

function loadImageDimensions(file: File): Promise<{ width: number; height: number; preview: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, preview: url });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// --- Helper to get max cards for current mode ---
function getMaxCards(): number {
  return getWorkspaceConfig(loadWorkMode()).maxCards;
}

// --- Store interface ---

interface AppState {
  // Workspace mode
  workMode: WorkMode;
  setWorkMode: (mode: WorkMode) => void;

  // Images
  uploadedImages: UploadedImage[];
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;

  // Templates
  templates: TemplateImage[];
  setTemplates: (files: File[]) => Promise<void>;
  setSingleTemplate: (file: File) => Promise<void>;
  removeTemplate: (id: number) => void;
  clearTemplates: () => void;

  // Template groups
  templateGroups: TemplateGroupMeta[];
  saveTemplateGroup: (name: string) => Promise<void>;
  deleteTemplateGroup: (id: string) => Promise<void>;
  loadTemplateGroup: (groupId: string) => Promise<void>;

  // Card bindings
  cards: TarotCard[];
  bindImage: (cardId: number, imageId: string) => void;
  unbindImage: (cardId: number) => void;
  bindAllImages: () => void;
  unbindAllImages: () => void;

  // Process settings (persisted)
  settings: ProcessSettings;
  updateSettings: (update: Partial<ProcessSettings>) => void;

  // Custom size presets (persisted)
  customPresets: SizePreset[];
  addCustomPreset: (name: string, width: number, height: number) => void;
  removeCustomPreset: (id: string) => void;

  // Export
  isExporting: boolean;
  exportProgress: number;
  setExporting: (val: boolean) => void;
  setExportProgress: (val: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Workspace mode
  workMode: 'tarot',
  setWorkMode: (mode: WorkMode) => {
    const prevMode = get().workMode;
    if (prevMode === mode) return;

    const config = getWorkspaceConfig(mode);

    // Clear templates (they are mode-specific by card count)
    const oldTemplates = get().templates;
    const oldPreviewSet = new Set<string>();
    oldTemplates.forEach(t => oldPreviewSet.add(t.preview));
    oldPreviewSet.forEach(url => URL.revokeObjectURL(url));

    saveWorkMode(mode);
    set({
      workMode: mode,
      cards: config.allCards,
      templates: [],
    });
  },

  // Images
  uploadedImages: [],
  addImages: async (files: File[]) => {
    const current = get().uploadedImages;
    const maxCards = getMaxCards();
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validFiles = files.filter(f => allowed.includes(f.type));
    const remaining = maxCards - current.length;
    const toAdd = validFiles.slice(0, remaining);

    const newImages: UploadedImage[] = [];
    for (const file of toAdd) {
      const { width, height, preview } = await loadImageDimensions(file);
      newImages.push({
        id: uuidv4(),
        file,
        preview,
        width,
        height,
        size: file.size,
        isUsed: false,
      });
    }

    set({ uploadedImages: [...current, ...newImages] });
  },
  removeImage: (id: string) => {
    const current = get().uploadedImages;
    const img = current.find(i => i.id === id);
    if (img) URL.revokeObjectURL(img.preview);
    set({ uploadedImages: current.filter(i => i.id !== id) });
  },
  clearImages: () => {
    const current = get().uploadedImages;
    current.forEach(i => URL.revokeObjectURL(i.preview));
    set({ uploadedImages: [] });
  },

  // Templates
  templates: [],
  setTemplates: async (files: File[]) => {
    const maxCards = getMaxCards();
    const sorted = [...files].sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '') || '0');
      const numB = parseInt(b.name.replace(/\D/g, '') || '0');
      return numA - numB;
    });

    const templates: TemplateImage[] = [];
    for (let i = 0; i < Math.min(sorted.length, maxCards); i++) {
      const file = sorted[i];
      const { width, height, preview } = await loadImageDimensions(file);
      templates.push({
        id: i + 1,
        file,
        preview,
        width,
        height,
      });
    }

    const oldTemplates = get().templates;
    oldTemplates.forEach(t => URL.revokeObjectURL(t.preview));
    set({ templates });
  },
  setSingleTemplate: async (file: File) => {
    const maxCards = getMaxCards();
    const { width, height, preview } = await loadImageDimensions(file);
    const templates: TemplateImage[] = [];
    for (let i = 1; i <= maxCards; i++) {
      templates.push({
        id: i,
        file,
        preview,
        width,
        height,
      });
    }
    const oldTemplates = get().templates;
    // Only revoke once since all share the same preview URL
    if (oldTemplates.length > 0) URL.revokeObjectURL(oldTemplates[0].preview);
    set({ templates });
  },
  removeTemplate: (id: number) => {
    const current = get().templates;
    const tpl = current.find(t => t.id === id);
    if (tpl) URL.revokeObjectURL(tpl.preview);
    set({ templates: current.filter(t => t.id !== id) });
  },
  clearTemplates: () => {
    const current = get().templates;
    current.forEach(t => URL.revokeObjectURL(t.preview));
    set({ templates: [] });
  },

  // Template groups
  templateGroups: loadTemplateGroups(),
  saveTemplateGroup: async (name: string) => {
    const { templates, templateGroups } = get();
    if (templates.length === 0) return;

    const thumbnailIds = templates.slice(0, 6).map(t => t.id);
    const firstTpl = templates[0];

    const group: TemplateGroupMeta = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
      templateCount: templates.length,
      thumbnailIds,
      templateWidth: firstTpl.width,
      templateHeight: firstTpl.height,
    };

    // Store actual template files as lossless PNG data URLs in IndexedDB
    const dataMap: Record<number, string> = {};
    let saved = 0;

    for (const tpl of templates) {
      try {
        const img = await loadImage(tpl.preview);
        dataMap[tpl.id] = imageToDataUrl(img);
        saved++;
      } catch {
        console.warn(`Failed to process template #${tpl.id}`);
      }
    }

    if (saved > 0) {
      try {
        await idbSet(`tpl-data-${group.id}`, JSON.stringify(dataMap));
        const newGroups = [...templateGroups, group];
        saveTemplateGroups(newGroups);
        set({ templateGroups: newGroups });
      } catch (e) {
        console.error('Failed to save template group:', e);
        throw e;
      }
    }
  },
  deleteTemplateGroup: async (id: string) => {
    const { templateGroups } = get();
    const newGroups = templateGroups.filter(g => g.id !== id);
    saveTemplateGroups(newGroups);
    // Also remove the image data from IndexedDB
    try { await idbDelete(`tpl-data-${id}`); } catch { /* ignore */ }
    set({ templateGroups: newGroups });
  },
  loadTemplateGroup: async (groupId: string) => {
    let dataMap: Record<number, string>;
    try {
      const raw = await idbGet(`tpl-data-${groupId}`);
      if (!raw) {
        // Fallback: try old localStorage key for backward compatibility
        const lsRaw = localStorage.getItem(`tarot-tpl-data-${groupId}`);
        if (!lsRaw) return;
        dataMap = JSON.parse(lsRaw);
      } else {
        dataMap = JSON.parse(raw);
      }
    } catch {
      return;
    }

    // Convert data URLs back to File objects
    const entries = Object.entries(dataMap);
    const files: File[] = [];

    for (const [idStr, dataUrl] of entries) {
      try {
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        const fileName = `template_${idStr}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        files.push(file);
      } catch {
        console.warn(`Failed to load template ${idStr}`);
      }
    }

    if (files.length > 0) {
      await get().setTemplates(files);
    }
  },

  // Card bindings
  cards: TAROT_CARDS,
  bindImage: (cardId: number, imageId: string) => {
    const { cards, uploadedImages } = get();
    const prevCard = cards.find(c => c.id === cardId);
    if (prevCard?.boundImageId) {
      set({
        uploadedImages: uploadedImages.map(img =>
          img.id === prevCard.boundImageId ? { ...img, isUsed: false } : img
        ),
      });
    }
    set({
      cards: cards.map(c => c.id === cardId ? { ...c, boundImageId: imageId } : c),
      uploadedImages: uploadedImages.map(img =>
        img.id === imageId ? { ...img, isUsed: true } : img
      ),
    });
  },
  unbindImage: (cardId: number) => {
    const { cards, uploadedImages } = get();
    const card = cards.find(c => c.id === cardId);
    if (card?.boundImageId) {
      set({
        cards: cards.map(c => c.id === cardId ? { ...c, boundImageId: undefined } : c),
        uploadedImages: uploadedImages.map(img =>
          img.id === card.boundImageId ? { ...img, isUsed: false } : img
        ),
      });
    }
  },
  bindAllImages: () => {
    const { cards, uploadedImages } = get();
    const resetImages = uploadedImages.map(img => ({ ...img, isUsed: false }));
    const resetCards = cards.map(c => ({ ...c, boundImageId: undefined }));
    const sortedImages = [...resetImages].sort((a, b) => {
      const numA = parseInt(a.file.name.replace(/\D/g, '') || '0');
      const numB = parseInt(b.file.name.replace(/\D/g, '') || '0');
      return numA - numB;
    });
    const newCards = [...resetCards];
    const newImages = [...sortedImages];
    const bindCount = Math.min(newCards.length, newImages.length);
    for (let i = 0; i < bindCount; i++) {
      newCards[i] = { ...newCards[i], boundImageId: newImages[i].id };
      newImages[i] = { ...newImages[i], isUsed: true };
    }
    set({ cards: newCards, uploadedImages: newImages });
  },
  unbindAllImages: () => {
    const { cards, uploadedImages } = get();
    set({
      cards: cards.map(c => ({ ...c, boundImageId: undefined })),
      uploadedImages: uploadedImages.map(img => ({ ...img, isUsed: false })),
    });
  },

  // Process settings (persisted to localStorage)
  settings: loadSettings(),
  updateSettings: (update) => {
    const newSettings = { ...get().settings, ...update };
    set({ settings: newSettings });
    saveSettings(newSettings);
  },

  // Custom size presets (persisted to localStorage)
  customPresets: loadSizePresets(),
  addCustomPreset: (name, width, height) => {
    const { customPresets } = get();
    const preset: SizePreset = { id: uuidv4(), name, width, height };
    const newList = [...customPresets, preset];
    saveSizePresets(newList);
    set({ customPresets: newList });
  },
  removeCustomPreset: (id) => {
    const { customPresets } = get();
    const newList = customPresets.filter(p => p.id !== id);
    saveSizePresets(newList);
    set({ customPresets: newList });
  },

  // Export
  isExporting: false,
  exportProgress: 0,
  setExporting: (val) => set({ isExporting: val }),
  setExportProgress: (val) => set({ exportProgress: val }),
}));

export type WorkMode = 'tarot' | 'poker';

export type CardCategory = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'
  | 'joker' | 'spade' | 'heart' | 'club' | 'diamond';

export interface TarotCard {
  id: number; // 1-78 (tarot) or 1-54 (poker)
  nameCn: string;
  nameEn: string;
  category: CardCategory;
  emoji: string;
  description: string;
  color: string;
  boundImageId?: string;
}

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
  size: number;
  isUsed: boolean;
}

export interface TemplateImage {
  id: number; // 1-78 (tarot) or 1-54 (poker)
  file: File;
  preview: string;
  width: number;
  height: number;
}

export type ProcessMode = 'stretch' | 'crop';

export interface ProcessSettings {
  mode: ProcessMode;
  width: number;
  height: number;
}

export interface SizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface CategoryInfo {
  key: CardCategory;
  labelCn: string;
  labelEn: string;
  color: string;
  startId: number;
  endId: number;
}

export interface TemplateGroupMeta {
  id: string;
  name: string;
  createdAt: number;
  templateCount: number;
  thumbnailIds: number[]; // first 6 template IDs used for preview grid
  templateWidth: number;
  templateHeight: number;
}

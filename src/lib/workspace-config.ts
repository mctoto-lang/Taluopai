import { WorkMode, CategoryInfo, TarotCard } from '@/types';
import { TAROT_CATEGORIES, TAROT_CARDS, getCategoryCards as getTarotCardsByCategory } from '@/lib/tarot-data';
import { POKER_CATEGORIES, POKER_CARDS, getPokerCardsByCategory } from '@/lib/poker-data';

export interface WorkspaceConfig {
  mode: WorkMode;
  label: string;
  emoji: string;
  maxCards: number;
  categories: CategoryInfo[];
  allCards: TarotCard[];
  description: string;
  heroTitle: string;
  heroDescription: string;
  guideTip: string;
  exportFilename: string;
  emblemSrc: string;
  footerText: string;
}

const TAROT_CONFIG: WorkspaceConfig = {
  mode: 'tarot',
  label: '塔罗牌工作台',
  emoji: '🔮',
  maxCards: 78,
  categories: TAROT_CATEGORIES,
  allCards: TAROT_CARDS,
  description: '上传 78 张模板图片，或从已保存的模板组中加载',
  heroTitle: '78 张塔罗牌',
  heroDescription: '上传图片、选择模板、配置参数，一键导出完整的塔罗牌牌组',
  guideTip: '提示：先点击上方「图片上传」上传图片，然后点击卡片绑定对应图片',
  exportFilename: '塔罗牌',
  emblemSrc: '/icons8-塔罗牌-96.png',
  footerText: '塔罗牌工作台 · 快速处理与导出 78 张塔罗牌',
};

const POKER_CONFIG: WorkspaceConfig = {
  mode: 'poker',
  label: '扑克牌工作台',
  emoji: '🃏',
  maxCards: 54,
  categories: POKER_CATEGORIES,
  allCards: POKER_CARDS,
  description: '上传 54 张模板图片，或从已保存的模板组中加载',
  heroTitle: '54 张扑克牌',
  heroDescription: '上传图片、选择模板、配置参数，一键导出完整的扑克牌牌组',
  guideTip: '提示：先点击上方「图片上传」上传图片，然后点击卡片绑定对应图片',
  exportFilename: '扑克牌',
  emblemSrc: '/icons8-牌-100.png',
  footerText: '扑克牌工作台 · 快速处理与导出 54 张扑克牌',
};

const configMap: Record<WorkMode, WorkspaceConfig> = {
  tarot: TAROT_CONFIG,
  poker: POKER_CONFIG,
};

export function getWorkspaceConfig(mode: WorkMode): WorkspaceConfig {
  return configMap[mode];
}

export function getCardsByCategory(category: string, mode: WorkMode): TarotCard[] {
  if (mode === 'poker') {
    return getPokerCardsByCategory(category);
  }
  return getTarotCardsByCategory(category);
}

import { TarotCard, CategoryInfo } from '@/types';

export const POKER_CATEGORIES: CategoryInfo[] = [
  { key: 'joker', labelCn: '大小王', labelEn: 'Joker', color: '#E11D48', startId: 1, endId: 2 },
  { key: 'spade', labelCn: '♠黑桃', labelEn: 'Spades', color: '#1e293b', startId: 3, endId: 15 },
  { key: 'heart', labelCn: '♥红心', labelEn: 'Hearts', color: '#DC2626', startId: 16, endId: 28 },
  { key: 'club', labelCn: '♣梅花', labelEn: 'Clubs', color: '#15803D', startId: 29, endId: 41 },
  { key: 'diamond', labelCn: '♦方块', labelEn: 'Diamonds', color: '#D97706', startId: 42, endId: 54 },
];

// Helper to build suit cards 2-10, J, Q, K, A (13 cards per suit)
function buildSuitCards(
  category: string,
  suitSymbol: string,
  suitNameEn: string,
  suitNameCn: string,
  startId: number,
  color: string,
): TarotCard[] {
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const rankDescriptions: Record<string, string> = {
    '2': '二', '3': '三', '4': '四', '5': '五', '6': '六',
    '7': '七', '8': '八', '9': '九', '10': '十',
    'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  };

  return ranks.map((rank, i) => ({
    id: startId + i,
    nameCn: `${suitNameCn}${rankDescriptions[rank] || rank}`,
    nameEn: `${rank} of ${suitNameEn}`,
    category: category as TarotCard['category'],
    emoji: suitSymbol,
    description: `${suitNameCn}${rank} — 标准扑克牌`,
    color,
  }));
}

export const POKER_CARDS: TarotCard[] = [
  // === 大小王 (1-2) ===
  {
    id: 1,
    nameCn: '大王',
    nameEn: 'Big Joker',
    category: 'joker',
    emoji: '🃏',
    description: '大王 — 万能牌，可在多数游戏中替代任意牌',
    color: '#E11D48',
  },
  {
    id: 2,
    nameCn: '小王',
    nameEn: 'Small Joker',
    category: 'joker',
    emoji: '🃏',
    description: '小王 — 特殊牌，功能因游戏规则而异',
    color: '#F97316',
  },

  // === 黑桃 (3-15) ===
  ...buildSuitCards('spade', '♠', 'Spades', '黑桃', 3, '#1e293b'),

  // === 红心 (16-28) ===
  ...buildSuitCards('heart', '♥', 'Hearts', '红心', 16, '#DC2626'),

  // === 梅花 (29-41) ===
  ...buildSuitCards('club', '♣', 'Clubs', '梅花', 29, '#15803D'),

  // === 方块 (42-54) ===
  ...buildSuitCards('diamond', '♦', 'Diamonds', '方块', 42, '#D97706'),
];

export function getPokerCardById(id: number): TarotCard | undefined {
  return POKER_CARDS.find(c => c.id === id);
}

export function getPokerCardsByCategory(category: string): TarotCard[] {
  return POKER_CARDS.filter(c => c.category === category);
}

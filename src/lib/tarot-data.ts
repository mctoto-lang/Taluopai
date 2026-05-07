import { TarotCard, CategoryInfo, CardCategory } from '@/types';

export const TAROT_CATEGORIES: CategoryInfo[] = [
  { key: 'major', labelCn: '大阿尔卡纳', labelEn: 'Major Arcana', color: '#FFD700', startId: 1, endId: 22 },
  { key: 'wands', labelCn: '权杖', labelEn: 'Wands', color: '#FF4500', startId: 23, endId: 36 },
  { key: 'cups', labelCn: '圣杯', labelEn: 'Cups', color: '#4169E1', startId: 37, endId: 50 },
  { key: 'swords', labelCn: '宝剑', labelEn: 'Swords', color: '#708090', startId: 51, endId: 64 },
  { key: 'pentacles', labelCn: '星币', labelEn: 'Pentacles', color: '#228B22', startId: 65, endId: 78 },
];

export const TAROT_CARDS: TarotCard[] = [
  // === 大阿尔卡纳 Major Arcana (1-22) ===
  { id: 1, nameCn: '愚人', nameEn: 'The Fool', category: 'major', emoji: '🃏', description: '新的开始，冒险精神，无限可能', color: '#FFD700' },
  { id: 2, nameCn: '魔术师', nameEn: 'The Magician', category: 'major', emoji: '🎩', description: '创造力，行动力，意志的力量', color: '#FF6B6B' },
  { id: 3, nameCn: '女祭司', nameEn: 'The High Priestess', category: 'major', emoji: '🌙', description: '直觉，神秘，内在智慧', color: '#9370DB' },
  { id: 4, nameCn: '女皇', nameEn: 'The Empress', category: 'major', emoji: '👑', description: '丰饶，母性，自然之美', color: '#32CD32' },
  { id: 5, nameCn: '皇帝', nameEn: 'The Emperor', category: 'major', emoji: '🏰', description: '权威，结构，领导力', color: '#B22222' },
  { id: 6, nameCn: '教皇', nameEn: 'The Hierophant', category: 'major', emoji: '⛪', description: '传统，教诲，精神指引', color: '#DAA520' },
  { id: 7, nameCn: '恋人', nameEn: 'The Lovers', category: 'major', emoji: '💕', description: '爱情，选择，和谐关系', color: '#FF69B4' },
  { id: 8, nameCn: '战车', nameEn: 'The Chariot', category: 'major', emoji: '⚔️', description: '胜利，决心，意志力', color: '#4169E1' },
  { id: 9, nameCn: '力量', nameEn: 'Strength', category: 'major', emoji: '🦁', description: '内在力量，勇气，耐心', color: '#FF8C00' },
  { id: 10, nameCn: '隐者', nameEn: 'The Hermit', category: 'major', emoji: '🏔️', description: '内省，独处，智慧的追求', color: '#708090' },
  { id: 11, nameCn: '命运之轮', nameEn: 'Wheel of Fortune', category: 'major', emoji: '🎡', description: '转变，机遇，命运的循环', color: '#8A2BE2' },
  { id: 12, nameCn: '正义', nameEn: 'Justice', category: 'major', emoji: '⚖️', description: '公平，真相，因果报应', color: '#4682B4' },
  { id: 13, nameCn: '倒吊人', nameEn: 'The Hanged Man', category: 'major', emoji: '🔄', description: '牺牲，新视角，等待', color: '#6A5ACD' },
  { id: 14, nameCn: '死神', nameEn: 'Death', category: 'major', emoji: '💀', description: '结束，转化，重生', color: '#2F4F4F' },
  { id: 15, nameCn: '节制', nameEn: 'Temperance', category: 'major', emoji: '🏺', description: '平衡，适度，融合', color: '#87CEEB' },
  { id: 16, nameCn: '恶魔', nameEn: 'The Devil', category: 'major', emoji: '🔗', description: '束缚，诱惑，阴影面', color: '#8B0000' },
  { id: 17, nameCn: '塔', nameEn: 'The Tower', category: 'major', emoji: '⚡', description: '突变，启示，崩溃', color: '#CD5C5C' },
  { id: 18, nameCn: '星星', nameEn: 'The Star', category: 'major', emoji: '⭐', description: '希望，灵感，治愈', color: '#00CED1' },
  { id: 19, nameCn: '月亮', nameEn: 'The Moon', category: 'major', emoji: '🌕', description: '幻觉，恐惧，潜意识', color: '#C0C0C0' },
  { id: 20, nameCn: '太阳', nameEn: 'The Sun', category: 'major', emoji: '☀️', description: '成功，喜悦，生命力', color: '#FFD700' },
  { id: 21, nameCn: '审判', nameEn: 'Judgement', category: 'major', emoji: '📯', description: '觉醒，重生，审视', color: '#D2691E' },
  { id: 22, nameCn: '世界', nameEn: 'The World', category: 'major', emoji: '🌍', description: '完成，圆满，新的旅程', color: '#48D1CC' },

  // === 权杖 Wands (23-36) ===
  { id: 23, nameCn: '权杖一', nameEn: 'Ace of Wands', category: 'wands', emoji: '🔥', description: '激情，灵感，创造力', color: '#FF4500' },
  { id: 24, nameCn: '权杖二', nameEn: 'Two of Wands', category: 'wands', emoji: '🔥', description: '规划，抉择，未来愿景', color: '#FF6347' },
  { id: 25, nameCn: '权杖三', nameEn: 'Three of Wands', category: 'wands', emoji: '🔥', description: '远见，扩张，贸易', color: '#FF7F50' },
  { id: 26, nameCn: '权杖四', nameEn: 'Four of Wands', category: 'wands', emoji: '🔥', description: '庆典，和谐，归属感', color: '#FFA07A' },
  { id: 27, nameCn: '权杖五', nameEn: 'Five of Wands', category: 'wands', emoji: '🔥', description: '竞争，冲突，挑战', color: '#FA8072' },
  { id: 28, nameCn: '权杖六', nameEn: 'Six of Wands', category: 'wands', emoji: '🔥', description: '胜利，认可，领导力', color: '#E9967A' },
  { id: 29, nameCn: '权杖七', nameEn: 'Seven of Wands', category: 'wands', emoji: '🔥', description: '防御，坚持，勇气', color: '#F08080' },
  { id: 30, nameCn: '权杖八', nameEn: 'Eight of Wands', category: 'wands', emoji: '🔥', description: '速度，进展，突然变化', color: '#DC143C' },
  { id: 31, nameCn: '权杖九', nameEn: 'Nine of Wands', category: 'wands', emoji: '🔥', description: '坚韧，韧性，最后防线', color: '#B22222' },
  { id: 32, nameCn: '权杖十', nameEn: 'Ten of Wands', category: 'wands', emoji: '🔥', description: '负担，责任，过度承担', color: '#800000' },
  { id: 33, nameCn: '权杖侍从', nameEn: 'Page of Wands', category: 'wands', emoji: '📨', description: '探索，热情，新消息', color: '#FF4500' },
  { id: 34, nameCn: '权杖骑士', nameEn: 'Knight of Wands', category: 'wands', emoji: '🐎', description: '冒险，冲动，激情', color: '#FF6347' },
  { id: 35, nameCn: '权杖王后', nameEn: 'Queen of Wands', category: 'wands', emoji: '👸', description: '自信，魅力，独立', color: '#FF7F50' },
  { id: 36, nameCn: '权杖国王', nameEn: 'King of Wands', category: 'wands', emoji: '🤴', description: '领导力，远见，企业家精神', color: '#FFA500' },

  // === 圣杯 Cups (37-50) ===
  { id: 37, nameCn: '圣杯一', nameEn: 'Ace of Cups', category: 'cups', emoji: '💧', description: '新情感，爱，直觉', color: '#4169E1' },
  { id: 38, nameCn: '圣杯二', nameEn: 'Two of Cups', category: 'cups', emoji: '💧', description: '联结，合作，相爱', color: '#4682B4' },
  { id: 39, nameCn: '圣杯三', nameEn: 'Three of Cups', category: 'cups', emoji: '💧', description: '欢庆，友谊，社交', color: '#5F9EA0' },
  { id: 40, nameCn: '圣杯四', nameEn: 'Four of Cups', category: 'cups', emoji: '💧', description: '不满，沉思，拒绝', color: '#6495ED' },
  { id: 41, nameCn: '圣杯五', nameEn: 'Five of Cups', category: 'cups', emoji: '💧', description: '失落，悲伤，遗憾', color: '#7B68EE' },
  { id: 42, nameCn: '圣杯六', nameEn: 'Six of Cups', category: 'cups', emoji: '💧', description: '怀旧，童真，回忆', color: '#87CEEB' },
  { id: 43, nameCn: '圣杯七', nameEn: 'Seven of Cups', category: 'cups', emoji: '💧', description: '幻想，选择，幻象', color: '#9370DB' },
  { id: 44, nameCn: '圣杯八', nameEn: 'Eight of Cups', category: 'cups', emoji: '💧', description: '放弃，寻找，离开', color: '#6A5ACD' },
  { id: 45, nameCn: '圣杯九', nameEn: 'Nine of Cups', category: 'cups', emoji: '💧', description: '满足，愿望达成，幸福', color: '#4169E1' },
  { id: 46, nameCn: '圣杯十', nameEn: 'Ten of Cups', category: 'cups', emoji: '💧', description: '和谐，家庭幸福，美满', color: '#00BFFF' },
  { id: 47, nameCn: '圣杯侍从', nameEn: 'Page of Cups', category: 'cups', emoji: '💌', description: '敏感，创意，直觉讯息', color: '#4682B4' },
  { id: 48, nameCn: '圣杯骑士', nameEn: 'Knight of Cups', category: 'cups', emoji: '🦢', description: '浪漫，理想主义，邀请', color: '#5F9EA0' },
  { id: 49, nameCn: '圣杯王后', nameEn: 'Queen of Cups', category: 'cups', emoji: '🧜‍♀️', description: '同情，直觉，滋养', color: '#7B68EE' },
  { id: 50, nameCn: '圣杯国王', nameEn: 'King of Cups', category: 'cups', emoji: '🔱', description: '情感智慧，平衡，外交', color: '#4169E1' },

  // === 宝剑 Swords (51-64) ===
  { id: 51, nameCn: '宝剑一', nameEn: 'Ace of Swords', category: 'swords', emoji: '⚔️', description: '突破，真理，清晰', color: '#708090' },
  { id: 52, nameCn: '宝剑二', nameEn: 'Two of Swords', category: 'swords', emoji: '⚔️', description: '困境，平衡，回避', color: '#778899' },
  { id: 53, nameCn: '宝剑三', nameEn: 'Three of Swords', category: 'swords', emoji: '⚔️', description: '心碎，悲伤，分离', color: '#696969' },
  { id: 54, nameCn: '宝剑四', nameEn: 'Four of Swords', category: 'swords', emoji: '⚔️', description: '休息，恢复，冥想', color: '#A9A9A9' },
  { id: 55, nameCn: '宝剑五', nameEn: 'Five of Swords', category: 'swords', emoji: '⚔️', description: '失败，冲突，背叛', color: '#808080' },
  { id: 56, nameCn: '宝剑六', nameEn: 'Six of Swords', category: 'swords', emoji: '⚔️', description: '过渡，疗愈，离开困境', color: '#B0C4DE' },
  { id: 57, nameCn: '宝剑七', nameEn: 'Seven of Swords', category: 'swords', emoji: '⚔️', description: '欺骗，策略，逃离', color: '#C0C0C0' },
  { id: 58, nameCn: '宝剑八', nameEn: 'Eight of Swords', category: 'swords', emoji: '⚔️', description: '束缚，限制，受害者心态', color: '#D3D3D3' },
  { id: 59, nameCn: '宝剑九', nameEn: 'Nine of Swords', category: 'swords', emoji: '⚔️', description: '焦虑，噩梦，担忧', color: '#778899' },
  { id: 60, nameCn: '宝剑十', nameEn: 'Ten of Swords', category: 'swords', emoji: '⚔️', description: '终结，最低谷，背叛', color: '#696969' },
  { id: 61, nameCn: '宝剑侍从', nameEn: 'Page of Swords', category: 'swords', emoji: '🔍', description: '好奇，警觉，新思想', color: '#B0C4DE' },
  { id: 62, nameCn: '宝剑骑士', nameEn: 'Knight of Swords', category: 'swords', emoji: '🌪️', description: '冲动，行动，快速思考', color: '#708090' },
  { id: 63, nameCn: '宝剑王后', nameEn: 'Queen of Swords', category: 'swords', emoji: '🦅', description: '独立，清晰，边界', color: '#A9A9A9' },
  { id: 64, nameCn: '宝剑国王', nameEn: 'King of Swords', category: 'swords', emoji: '🗡️', description: '理性，权威，公正', color: '#C0C0C0' },

  // === 星币 Pentacles (65-78) ===
  { id: 65, nameCn: '星币一', nameEn: 'Ace of Pentacles', category: 'pentacles', emoji: '💰', description: '新机遇，丰盛，务实', color: '#228B22' },
  { id: 66, nameCn: '星币二', nameEn: 'Two of Pentacles', category: 'pentacles', emoji: '💰', description: '平衡，灵活，适应', color: '#2E8B57' },
  { id: 67, nameCn: '星币三', nameEn: 'Three of Pentacles', category: 'pentacles', emoji: '💰', description: '团队协作，技艺，成就', color: '#3CB371' },
  { id: 68, nameCn: '星币四', nameEn: 'Four of Pentacles', category: 'pentacles', emoji: '💰', description: '保守，安全，执着', color: '#32CD32' },
  { id: 69, nameCn: '星币五', nameEn: 'Five of Pentacles', category: 'pentacles', emoji: '💰', description: '困顿，失去，精神困境', color: '#556B2F' },
  { id: 70, nameCn: '星币六', nameEn: 'Six of Pentacles', category: 'pentacles', emoji: '💰', description: '慷慨，慈善，分享', color: '#6B8E23' },
  { id: 71, nameCn: '星币七', nameEn: 'Seven of Pentacles', category: 'pentacles', emoji: '💰', description: '耐心，评估，投资', color: '#808000' },
  { id: 72, nameCn: '星币八', nameEn: 'Eight of Pentacles', category: 'pentacles', emoji: '💰', description: '专注，工匠精神，勤奋', color: '#228B22' },
  { id: 73, nameCn: '星币九', nameEn: 'Nine of Pentacles', category: 'pentacles', emoji: '💰', description: '富足，独立，享受劳动成果', color: '#006400' },
  { id: 74, nameCn: '星币十', nameEn: 'Ten of Pentacles', category: 'pentacles', emoji: '💰', description: '遗产，家族财富，稳定', color: '#2E8B57' },
  { id: 75, nameCn: '星币侍从', nameEn: 'Page of Pentacles', category: 'pentacles', emoji: '📚', description: '学习，务实，新机会', color: '#3CB371' },
  { id: 76, nameCn: '星币骑士', nameEn: 'Knight of Pentacles', category: 'pentacles', emoji: '🐴', description: '可靠，勤奋，稳步前进', color: '#32CD32' },
  { id: 77, nameCn: '星币王后', nameEn: 'Queen of Pentacles', category: 'pentacles', emoji: '🌿', description: '滋养，务实，繁荣', color: '#228B22' },
  { id: 78, nameCn: '星币国王', nameEn: 'King of Pentacles', category: 'pentacles', emoji: '👑', description: '财富，事业成功，慷慨', color: '#006400' },
];

export function getCardById(id: number): TarotCard | undefined {
  return TAROT_CARDS.find(c => c.id === id);
}

export function getCardsByCategory(category: string): TarotCard[] {
  return TAROT_CARDS.filter(c => c.category === category);
}

export function getCategoryCards(category: CardCategory): TarotCard[] {
  return TAROT_CARDS.filter(c => c.category === category);
}

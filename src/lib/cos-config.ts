export const COS_CONFIG = {
  bucket: 'magic-img-taluopai-1317363725',
  region: 'ap-guangzhou',
  baseUrl: 'https://magic-img-taluopai-1317363725.cos.ap-guangzhou.myqcloud.com',
  folders: {
    cardFront: '塔罗牌-图片-文件夹/卡牌牌面',
    cardBack: '塔罗牌-图片-文件夹/卡牌牌背',
  },
};

export function getCosUrl(path: string): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${COS_CONFIG.baseUrl}/${encodedPath}`;
}

export function isCosUrl(url: string): boolean {
  return url.includes('magic-img-taluopai-1317363725.cos.ap-guangzhou.myqcloud.com');
}

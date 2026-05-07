import JSZip from 'jszip';

export interface ClientProcessOptions {
  mode: 'stretch' | 'crop';
  width: number;
  height: number;
  templateWidth: number;
  templateHeight: number;
}

/**
 * Load a File or Blob as an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

/**
 * Draw image onto a canvas with given mode, then composite template on top.
 * Returns a Blob (image/jpeg, quality 0.92).
 */
export async function processCardToBlob(
  imageUrl: string,
  templateUrl: string,
  options: ClientProcessOptions
): Promise<Blob> {
  const { mode, width, height, templateWidth, templateHeight } = options;

  const [img, tpl] = await Promise.all([loadImage(imageUrl), loadImage(templateUrl)]);

  const canvas = document.createElement('canvas');
  canvas.width = templateWidth;
  canvas.height = templateHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, templateWidth, templateHeight);

  const dx = (templateWidth - width) / 2;
  const dy = (templateHeight - height) / 2;

  if (mode === 'stretch') {
    ctx.drawImage(img, dx, dy, width, height);
  } else {
    const scaleX = width / img.naturalWidth;
    const scaleY = height / img.naturalHeight;
    const scale = Math.max(scaleX, scaleY);

    const sw = width / scale;
    const sh = height / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

    ctx.drawImage(tempCanvas, dx, dy);
  }

  const tdx = (templateWidth - tpl.naturalWidth) / 2;
  const tdy = (templateHeight - tpl.naturalHeight) / 2;
  ctx.drawImage(tpl, tdx, tdy);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob 失败'))),
      'image/jpeg',
      0.92
    );
  });
}

/**
 * Export all cards as a ZIP, calling onProgress(cardIndex) for each card processed.
 * Returns the ZIP blob.
 */
export async function exportAllCards(
  cardEntries: Array<{
    id: number;
    nameCn: string;
    imageUrl: string;
    templatePreview: string;
  }>,
  options: ClientProcessOptions,
  onProgress: (index: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < cardEntries.length; i++) {
    const entry = cardEntries[i];
    try {
      const blob = await processCardToBlob(entry.imageUrl, entry.templatePreview, options);
      const fileName = `${entry.id}-${entry.nameCn}.jpg`;
      zip.file(fileName, blob);
    } catch (err) {
      console.error(`[Export] Failed to process card ${entry.id} (${entry.nameCn}):`, err);
      // Continue with next card instead of failing entirely
    }
    onProgress(i + 1);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

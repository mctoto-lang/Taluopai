import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isCosUrl } from '@/lib/cos-config';

const UPLOAD_DIR = path.join(process.cwd(), 'upload', 'card-templates');
const META_FILE = path.join(UPLOAD_DIR, 'metadata.json');

interface TemplateMeta {
  id: string;
  filename: string;
  displayName: string;
  group: string;
  tagText: string;
  tagColor: string;
  uploadedAt: number;
  source?: 'local' | 'url';
  originalUrl?: string;
}

async function readMeta(): Promise<TemplateMeta[]> {
  try {
    const raw = await fs.readFile(META_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/**
 * Download image from URL and save to local disk
 * Returns the saved file path, or null on failure
 */
async function downloadAndCache(
  originalUrl: string,
  targetFilename: string,
): Promise<string | null> {
  try {
    const resp = await fetch(originalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) return null;

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await resp.arrayBuffer());

    // Determine extension from content-type
    const extMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    const ext = extMap[contentType.split(';')[0].trim()] || '.png';

    // If target filename doesn't have the correct extension, regenerate it
    let saveFilename = targetFilename;
    if (!saveFilename.endsWith(ext)) {
      const base = path.basename(saveFilename, path.extname(saveFilename));
      saveFilename = `${base}${ext}`;
    }

    const filePath = path.join(UPLOAD_DIR, saveFilename);
    await fs.writeFile(filePath, buffer);

    // If filename changed, update metadata
    if (saveFilename !== targetFilename) {
      const meta = await readMeta();
      const idx = meta.findIndex((m) => m.filename === targetFilename);
      if (idx !== -1) {
        meta[idx].filename = saveFilename;
        await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
      }
    }

    return filePath;
  } catch (err) {
    console.error(`[Cache download] failed for ${originalUrl}:`, err);
    return null;
  }
}

/**
 * Serve a cached file buffer
 */
function serveFile(buffer: Buffer, filename: string): NextResponse {
  const ext = path.extname(filename).toLowerCase();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=604800',
    },
  });
}

// GET /api/card-templates/file/[filename] — serve image file with URL fallback or redirect to COS
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === '1';

  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeName);

  try {
    const meta = await readMeta();
    const item = meta.find((m) => m.filename === safeName);

    if (!item) {
      return NextResponse.json({ error: '文件未找到' }, { status: 404 });
    }

    if (item.source === 'url' && item.originalUrl && isCosUrl(item.originalUrl)) {
      return NextResponse.redirect(item.originalUrl);
    }

    if (!forceRefresh) {
      try {
        const buffer = await fs.readFile(filePath);
        return serveFile(buffer, safeName);
      } catch {
        // File doesn't exist locally
      }
    }

    if (!item?.originalUrl) {
      return NextResponse.json({ error: '文件未找到' }, { status: 404 });
    }

    if (forceRefresh) {
      try { await fs.unlink(filePath); } catch { /* ignore */ }
    }

    const cachedPath = await downloadAndCache(item.originalUrl, safeName);
    if (!cachedPath) {
      return NextResponse.json({ error: '从网络下载图片失败' }, { status: 502 });
    }

    const buffer = await fs.readFile(cachedPath);
    const cachedFilename = path.basename(cachedPath);
    return serveFile(buffer, cachedFilename);
  } catch (err) {
    console.error('[GET file] error:', err);
    return NextResponse.json({ error: '文件未找到' }, { status: 404 });
  }
}

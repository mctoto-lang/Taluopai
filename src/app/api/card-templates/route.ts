import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;
export const runtime = 'nodejs';

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

async function ensureDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
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

async function writeMeta(data: TemplateMeta[]) {
  await fs.writeFile(META_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/card-templates — list all templates grouped
// ?refresh=1 — force re-download all URL-sourced images from their original URLs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    const meta = await readMeta();

    // If refresh requested, re-download all URL-sourced images
    if (forceRefresh) {
      const urlItems = meta.filter((m) => m.source === 'url' && m.originalUrl);
      let refreshed = 0;
      let failed = 0;

      for (const item of urlItems) {
        try {
          // Delete old cached file
          try { await fs.unlink(path.join(UPLOAD_DIR, item.filename)); } catch { /* ignore */ }

          // Download from original URL
          const resp = await fetch(item.originalUrl!, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!resp.ok) { failed++; continue; }

          const contentType = resp.headers.get('content-type') || '';
          if (!contentType.startsWith('image/')) { failed++; continue; }

          const buffer = Buffer.from(await resp.arrayBuffer());
          const extMap: Record<string, string> = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
          };
          const ext = extMap[contentType.split(';')[0].trim()] || '.png';
          const newFilename = `${item.id}${ext}`;

          await fs.writeFile(path.join(UPLOAD_DIR, newFilename), buffer);
          item.filename = newFilename;
          refreshed++;
        } catch (err) {
          console.error(`[Refresh download] failed for ${item.originalUrl}:`, err);
          failed++;
        }
      }

      if (refreshed > 0 || failed > 0) {
        await writeMeta(meta);
      }
    }

    // Verify files actually exist (for URL-based items, try lazy cache)
    // Add hasLocalFile field to each item
    const valid: TemplateMeta[] = [];
    const fileExistsMap = new Map<string, boolean>();
    for (const item of meta) {
      let hasLocal = false;
      try {
        await fs.access(path.join(UPLOAD_DIR, item.filename));
        hasLocal = true;
        valid.push(item);
      } catch {
        // File doesn't exist locally
        if (item.source === 'url' && item.originalUrl) {
          // Still valid — will be lazily downloaded on first access via file endpoint
          if (item.filename) {
            valid.push(item);
          }
        }
        // local items with missing files are silently skipped
      }
      fileExistsMap.set(item.id, hasLocal);
    }

    // Group by group name
    const groups: Record<string, (TemplateMeta & { hasLocalFile: boolean })[]> = {};
    const itemsWithCache: (TemplateMeta & { hasLocalFile: boolean })[] = [];
    for (const item of valid) {
      const g = item.group || '未分组';
      const enriched = { ...item, hasLocalFile: fileExistsMap.get(item.id) ?? false };
      itemsWithCache.push(enriched);
      if (!groups[g]) groups[g] = [];
      groups[g].push(enriched);
    }

    return NextResponse.json({ items: itemsWithCache, groups });
  } catch (err) {
    console.error('[GET /api/card-templates] error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST /api/card-templates — upload new images or import from URL
export async function POST(request: NextRequest) {
  try {
    await ensureDir();
    const formData = await request.formData();

    const group = (formData.get('group') as string) || '未分组';
    const tagText = (formData.get('tagText') as string) || '';
    const tagColor = (formData.get('tagColor') as string) || '#6B7280';
    const displayNamesRaw = (formData.get('displayNames') as string) || '[]';
    let displayNames: string[] = [];
    try { displayNames = JSON.parse(displayNamesRaw); } catch { /* ignore */ }

    // Check for URL import
    const urlStr = (formData.get('urls') as string) || '';
    if (urlStr) {
      let urls: string[] = [];
      try { urls = JSON.parse(urlStr); } catch { /* ignore */ }
      urls = urls.map((u) => u.trim()).filter((u) => u.length > 0);

      if (urls.length === 0) {
        return NextResponse.json({ error: '没有有效的链接' }, { status: 400 });
      }

      const meta = await readMeta();
      const results: TemplateMeta[] = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const id = uuidv4();

        try {
          // Download image from URL
          const resp = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!resp.ok) continue;

          const contentType = resp.headers.get('content-type') || '';
          if (!contentType.startsWith('image/')) continue;

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
          const filename = `${id}${ext}`;

          await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

          // Generate display name from URL path
          let urlDisplayName = displayNames[i] || '';
          if (!urlDisplayName) {
            try {
              const urlPath = new URL(url).pathname;
              urlDisplayName = path.basename(urlPath, path.extname(urlPath)) || `图片${meta.length + 1}`;
            } catch {
              urlDisplayName = `图片${meta.length + 1}`;
            }
          }

          const item: TemplateMeta = {
            id,
            filename,
            displayName: urlDisplayName,
            group,
            tagText,
            tagColor,
            uploadedAt: Date.now(),
            source: 'url',
            originalUrl: url,
          };

          meta.push(item);
          results.push(item);
        } catch (err) {
          console.error(`[URL import] failed for ${url}:`, err);
        }
      }

      if (results.length === 0) {
        return NextResponse.json({ error: '所有链接导入失败，请检查链接是否有效' }, { status: 400 });
      }

      await writeMeta(meta);
      return NextResponse.json({ success: true, items: results, imported: results.length, total: urls.length });
    }

    // File upload
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 });
    }

    const meta = await readMeta();
    const results: TemplateMeta[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.name) || '.png';
      const id = uuidv4();
      const filename = `${id}${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

      const item: TemplateMeta = {
        id,
        filename,
        displayName: displayNames[i] || file.name.replace(ext, ''),
        group,
        tagText,
        tagColor,
        uploadedAt: Date.now(),
        source: 'local',
      };

      meta.push(item);
      results.push(item);
    }

    await writeMeta(meta);
    return NextResponse.json({ success: true, items: results });
  } catch (err) {
    console.error('[POST /api/card-templates] error:', err);
    return NextResponse.json({ error: '上传失败', details: String(err) }, { status: 500 });
  }
}

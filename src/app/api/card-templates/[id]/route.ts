import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeMeta(data: TemplateMeta[]) {
  await fs.writeFile(META_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

// PATCH /api/card-templates/[id] — update metadata and optionally replace image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = await readMeta();
  const idx = meta.findIndex((m) => m.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: '未找到该模板' }, { status: 404 });
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // FormData: image replacement + metadata
    try {
      const fd = await request.formData();
      const file = fd.get('file') as File | null;
      const imageUrl = (fd.get('imageUrl') as string | null)?.trim() || '';

      // If a new image is provided (file or URL), replace the old one
      if (file) {
        await ensureDir();
        // Delete old image file
        try {
          await fs.unlink(path.join(UPLOAD_DIR, meta[idx].filename));
        } catch { /* old file may not exist */ }

        // Detect extension from mime type
        const mimeMap: Record<string, string> = {
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/gif': '.gif',
          'image/webp': '.webp',
        };
        const ext = mimeMap[file.type] || '.png';
        const newFilename = `${uuidv4()}${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(UPLOAD_DIR, newFilename), buffer);
        meta[idx].filename = newFilename;
      } else if (imageUrl) {
        // Download image from URL and replace
        await ensureDir();
        try {
          const resp = await fetch(imageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!resp.ok) {
            return NextResponse.json({ error: `下载图片失败 (HTTP ${resp.status})` }, { status: 400 });
          }

          const respContentType = resp.headers.get('content-type') || '';
          if (!respContentType.startsWith('image/')) {
            return NextResponse.json({ error: '链接不是有效的图片地址' }, { status: 400 });
          }

          const buffer = Buffer.from(await resp.arrayBuffer());
          const extMap: Record<string, string> = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
          };
          const ext = extMap[respContentType.split(';')[0].trim()] || '.png';
          const newFilename = `${uuidv4()}${ext}`;

          // Delete old image file
          try {
            await fs.unlink(path.join(UPLOAD_DIR, meta[idx].filename));
          } catch { /* old file may not exist */ }

          await fs.writeFile(path.join(UPLOAD_DIR, newFilename), buffer);
          meta[idx].filename = newFilename;
          meta[idx].source = 'url';
          meta[idx].originalUrl = imageUrl;
        } catch (err) {
          console.error('[PATCH URL download]', err);
          return NextResponse.json({ error: '下载图片失败，请检查链接是否有效' }, { status: 400 });
        }
      }

      // Update metadata fields from form data
      const tagText = fd.get('tagText') as string | null;
      const tagColor = fd.get('tagColor') as string | null;
      const displayName = fd.get('displayName') as string | null;
      const group = fd.get('group') as string | null;

      if (displayName !== null) meta[idx].displayName = displayName;
      if (group !== null) meta[idx].group = group;
      if (tagText !== null) meta[idx].tagText = tagText;
      if (tagColor !== null) meta[idx].tagColor = tagColor;

      await writeMeta(meta);
      return NextResponse.json({ success: true, item: meta[idx] });
    } catch (e) {
      console.error('[PATCH card-template]', e);
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }
  } else {
    // JSON: metadata only
    const body = await request.json();

    if (body.displayName !== undefined) meta[idx].displayName = body.displayName;
    if (body.group !== undefined) meta[idx].group = body.group;
    if (body.tagText !== undefined) meta[idx].tagText = body.tagText;
    if (body.tagColor !== undefined) meta[idx].tagColor = body.tagColor;

    await writeMeta(meta);
    return NextResponse.json({ success: true, item: meta[idx] });
  }
}

// DELETE /api/card-templates/[id] — delete image & metadata
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = await readMeta();
  const idx = meta.findIndex((m) => m.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: '未找到该模板' }, { status: 404 });
  }

  // Remove file
  try {
    await fs.unlink(path.join(UPLOAD_DIR, meta[idx].filename));
  } catch { /* file may already be gone */ }

  meta.splice(idx, 1);
  await writeMeta(meta);

  return NextResponse.json({ success: true });
}

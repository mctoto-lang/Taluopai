import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import JSZip from "jszip";

interface CardBinding {
  id: number;
  nameCn: string;
  imageFile: File;
  templateFile: File;
}

interface ProcessSettings {
  mode: "stretch" | "crop";
  width: number;
  height: number;
}

async function processCard(
  imageBuffer: Buffer,
  templateBuffer: Buffer,
  settings: ProcessSettings,
  templateWidth: number,
  templateHeight: number
): Promise<Buffer> {
  const image = sharp(imageBuffer);

  // Resize based on mode
  let processedImage: sharp.Sharp;
  if (settings.mode === "stretch") {
    processedImage = image.resize(settings.width, settings.height, {
      fit: "fill",
    });
  } else {
    processedImage = image.resize(settings.width, settings.height, {
      fit: "cover",
      position: "center",
    });
  }

  const resizedBuffer = await processedImage.toBuffer();

  // Create white canvas at template dimensions
  const canvas = sharp({
    create: {
      width: templateWidth,
      height: templateHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  });

  // Composite: processed image first, then template overlay
  const result = await canvas
    .composite([
      { input: resizedBuffer, gravity: "center" },
      { input: templateBuffer, gravity: "center" },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Export] Starting export-all request...');
    const formData = await request.formData();
    console.log('[Export] FormData parsed, fields:', [...formData.keys()].length);

    // Parse cards JSON
    const cardsJson = formData.get("cards") as string | null;
    if (!cardsJson) {
      return NextResponse.json(
        { error: "Missing 'cards' field in form data" },
        { status: 400 }
      );
    }

    const cardsRaw: Array<{
      id: number;
      nameCn: string;
      imageFileKey: string;
      templateFileKey: string;
    }> = JSON.parse(cardsJson);

    // Parse settings JSON
    const settingsJson = formData.get("settings") as string | null;
    if (!settingsJson) {
      return NextResponse.json(
        { error: "Missing 'settings' field in form data" },
        { status: 400 }
      );
    }

    const settings: ProcessSettings = JSON.parse(settingsJson);

    // Parse template dimensions
    const templateWidth = parseInt(formData.get("templateWidth") as string, 10);
    const templateHeight = parseInt(formData.get("templateHeight") as string, 10);

    if (isNaN(templateWidth) || isNaN(templateHeight)) {
      return NextResponse.json(
        { error: "Invalid templateWidth or templateHeight" },
        { status: 400 }
      );
    }

    // Create ZIP
    const zip = new JSZip();

    // Process each card
    for (const card of cardsRaw) {
      const imageFile = formData.get(
        `image_${card.id}`
      ) as File | null;
      const templateFile = formData.get(
        `template_${card.id}`
      ) as File | null;

      if (!imageFile || !templateFile) {
        return NextResponse.json(
          {
            error: `Missing image or template file for card ${card.id} (${card.nameCn})`,
          },
          { status: 400 }
        );
      }

      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const templateBuffer = Buffer.from(await templateFile.arrayBuffer());

      const outputBuffer = await processCard(
        imageBuffer,
        templateBuffer,
        settings,
        templateWidth,
        templateHeight
      );

      // File naming: 序号-中文名.jpg
      const fileName = `${card.id}-${card.nameCn}.jpg`;
      zip.file(fileName, outputBuffer);
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // ZIP filename: 塔罗牌_YYYYMMDD_HHMMSS.zip
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const zipFilename = `塔罗牌_${timestamp}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zipFilename)}`,
      },
    });
  } catch (error) {
    console.error("Export all error:", error);

    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Handle body size limit errors
    if (message.includes('body') && (message.includes('size') || message.includes('limit') || message.includes('too large') || message.includes('413'))) {
      return NextResponse.json(
        { error: "请求体过大，请减少图片数量或压缩图片后重试" },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: `导出失败: ${message}` },
      { status: 500 }
    );
  }
}

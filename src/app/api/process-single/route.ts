import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

interface ProcessSettings {
  mode: "stretch" | "crop";
  width: number;
  height: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get image file
    const imageFile = formData.get("image") as File | null;
    if (!imageFile) {
      return NextResponse.json(
        { error: "Missing 'image' file in form data" },
        { status: 400 }
      );
    }

    // Get template file
    const templateFile = formData.get("template") as File | null;
    if (!templateFile) {
      return NextResponse.json(
        { error: "Missing 'template' file in form data" },
        { status: 400 }
      );
    }

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
    const templateWidth = parseInt(
      formData.get("templateWidth") as string,
      10
    );
    const templateHeight = parseInt(
      formData.get("templateHeight") as string,
      10
    );

    if (isNaN(templateWidth) || isNaN(templateHeight)) {
      return NextResponse.json(
        { error: "Invalid templateWidth or templateHeight" },
        { status: 400 }
      );
    }

    // Read file buffers
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const templateBuffer = Buffer.from(await templateFile.arrayBuffer());

    // Process image
    const image = sharp(imageBuffer);

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

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": result.length.toString(),
      },
    });
  } catch (error) {
    console.error("Process single error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process card" },
      { status: 500 }
    );
  }
}

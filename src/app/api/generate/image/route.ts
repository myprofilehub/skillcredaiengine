export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-images');
const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'skillcred-logo.jpg');

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio = '1:1', numberOfImages = 1 } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`Generating high-fidelity marketing image via Google Imagen 4: ${prompt}`);

    // Map aspect ratios to Imagen 4 supported formats
    const validAspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"];
    const targetRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    // Enhance prompt for SkillCred marketing aesthetic
    const marketingPrompt = `SkillCred Professional Marketing Graphic: ${prompt}. Clean graphic design, professional typography, high-resolution textures, studio lighting. Branding: modern, trustworthy, high-tech engineering aesthetic. CRYSTAL CLEAR TEXT.`;

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`;

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        instances: [{ prompt: marketingPrompt }],
        parameters: {
          sampleCount: Math.min(numberOfImages, 4),
          aspectRatio: targetRatio,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Imagen API Error Details:", JSON.stringify(errorData, null, 2));
      throw new Error(errorData.error?.message || `Google Imagen API responded with status ${response.status}`);
    }

    const data = await response.json();
    const images = data.predictions || data.generatedImages || [];

    if (images.length === 0) {
      throw new Error("Google Imagen returned no images.");
    }

    const results = [];

    for (const imgData of images) {
      const base64Content =
        imgData.bytesBase64Encoded ||
        imgData.base64 ||
        imgData.image?.imageBytes;

      if (!base64Content) {
        console.error("Unexpected image data format:", Object.keys(imgData));
        continue;
      }

      let imageBuffer = Buffer.from(base64Content, 'base64');
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LOGO WATERMARKING (using sharp)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        if (fs.existsSync(LOGO_PATH)) {
          // Get metadata of generated image to scale logo properly
          const metadata = await sharp(imageBuffer).metadata();
          const logoWidth = Math.floor((metadata.width || 1024) * 0.18); // 18% of width

          const logoBuffer = await sharp(LOGO_PATH)
            .resize(logoWidth)
            .toBuffer();

          imageBuffer = await sharp(imageBuffer)
            .composite([{
              input: logoBuffer,
              top: 30,
              left: 30,
              blend: 'screen'
            }])
            .toBuffer() as any;
        }
      } catch (sharpError) {
        console.warn("Watermarking failed, skipping logo placement:", sharpError);
      }

      const fileName = `${crypto.randomUUID()}.png`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      fs.writeFileSync(filePath, imageBuffer);

      const relativePath = `/generated-images/${fileName}`;
      // Sanitize baseUrl to ensure no trailing slash
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
      const absolutePath = (baseUrl && relativePath.startsWith('/')) ? `${baseUrl}${relativePath}` : relativePath;
      
      const imageId = crypto.randomUUID();

      // Persist to Prisma
      try {
        await prisma.generatedImage.create({
          data: {
            prompt: prompt,
            imageUrl: relativePath,
            status: 'COMPLETED',
            stream: 'Marketing Engine'
          }
        });
      } catch (dbError) {
        console.error("DB Save Error:", dbError);
      }

      results.push({ id: imageId, url: absolutePath });
    }

    if (results.length === 0) {
      throw new Error("Failed to extract image data from Imagen response.");
    }

    return NextResponse.json({
      success: true,
      images: results,
      prompt: prompt,
      modelUsed: "Google Imagen 4"
    });

  } catch (error: any) {
    console.error("FATAL Image Generation Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      details: "Ensure your GEMINI_API_KEY has Imagen access."
    }, { status: 500 });
  }
}
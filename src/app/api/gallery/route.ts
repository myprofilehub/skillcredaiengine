export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import { prisma } from '@/lib/prisma';
import { GeneratedVideo, GeneratedImage } from '@prisma/client';

export async function GET() {
  try {
    const [videos, images] = await Promise.all([
      prisma.generatedVideo.findMany({
        where: {
          status: { in: ['COMPLETED', 'GENERATING'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      }),
      prisma.generatedImage.findMany({
        where: {
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    // Sanitize baseUrl to ensure no trailing slash
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

    // Function to ensure URL is absolute if it starts with /
    const formatUrl = (url: string | null) => {
      if (!url) return null;
      
      // Redirect old static paths to the new serving API route
      let sanitizedUrl = url.replace('/generated-images/', '/api/images/');
      
      if (sanitizedUrl.startsWith('/') && baseUrl) {
        return `${baseUrl}${sanitizedUrl}`;
      }
      return sanitizedUrl;
    };

    // Combine and mark types
    const rawItems = [
      ...videos.map((v: GeneratedVideo) => ({ 
        ...v, 
        type: 'video',
        videoUrl: formatUrl(v.videoUrl),
        thumbnailUrl: formatUrl(v.thumbnailUrl),
        // Use the raw relative path for file existence check
        _filePath: v.videoUrl ? path.join(process.cwd(), 'public', v.videoUrl.replace('/api/videos/', 'generated-videos/')) : null
      })),
      ...images.map((i: GeneratedImage) => ({ 
        ...i, 
        type: 'image',
        imageUrl: formatUrl(i.imageUrl),
        // Use the raw relative path for file existence check
        _filePath: i.imageUrl ? path.join(process.cwd(), 'public', i.imageUrl.replace('/api/images/', 'generated-images/')) : null
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter to only include items that actually exist on disk
    const galleryItems = [];
    const missingItems = [];

    for (const item of rawItems) {
      if (item._filePath && fs.existsSync(item._filePath)) {
        const { _filePath, ...cleanItem } = item;
        galleryItems.push(cleanItem);
      } else {
        missingItems.push(item);
      }
      if (galleryItems.length >= 30) break;
    }

    // Optional: Log missing items for debugging
    if (missingItems.length > 0) {
      console.warn(`[Gallery] Found ${missingItems.length} records with missing physical files.`);
    }

    return NextResponse.json({ success: true, items: galleryItems });

  } catch (error: any) {
    console.error("Gallery fetch failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch gallery items" }, { status: 500 });
  }
}

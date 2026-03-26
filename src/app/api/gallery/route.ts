export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

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
      if (url.startsWith('/') && baseUrl) {
        return `${baseUrl}${url}`;
      }
      return url;
    };

    // Combine and mark types
    const galleryItems = [
      ...videos.map((v: GeneratedVideo) => ({ 
        ...v, 
        type: 'video',
        videoUrl: formatUrl(v.videoUrl),
        thumbnailUrl: formatUrl(v.thumbnailUrl)
      })),
      ...images.map((i: GeneratedImage) => ({ 
        ...i, 
        type: 'image',
        imageUrl: formatUrl(i.imageUrl)
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, items: galleryItems });

  } catch (error: any) {
    console.error("Gallery fetch failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch gallery items" }, { status: 500 });
  }
}

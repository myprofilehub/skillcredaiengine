import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Combine and mark types
    const galleryItems = [
      ...videos.map(v => ({ ...v, type: 'video' })),
      ...images.map(i => ({ ...i, type: 'image' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, items: galleryItems });

  } catch (error: any) {
    console.error("Gallery fetch failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch gallery items" }, { status: 500 });
  }
}

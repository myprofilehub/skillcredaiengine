import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = path.join(process.cwd(), 'public', 'generated-videos', ...pathSegments);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Video not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  
  // Determine content type based on extension
  let contentType = 'video/mp4';
  const filename = pathSegments[pathSegments.length - 1];
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (filename.endsWith('.png')) {
    contentType = 'image/png';
  }

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

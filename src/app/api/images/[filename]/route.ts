import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filePath = path.join(process.cwd(), 'public', 'generated-images', filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Image not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  
  // Determine content type based on extension
  let contentType = 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (filename.endsWith('.webp')) {
    contentType = 'image/webp';
  }

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

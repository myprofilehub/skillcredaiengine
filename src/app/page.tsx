import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

// Helper function to format date
function getTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

// Ensure the page is dynamically rendered, as it relies on database state
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [postsCount, imagesCount, videosCount] = await Promise.all([
    prisma.generatedPost.count(),
    prisma.generatedImage.count(),
    prisma.generatedVideo.count(),
  ]);

  const rawPosts = await prisma.generatedPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  
  const rawImages = await prisma.generatedImage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  
  const rawVideos = await prisma.generatedVideo.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  
  const allGenerations = [
    ...rawPosts.map((p: any) => ({
      id: p.id,
      type: "POST" as const,
      title: p.content.slice(0, 30).trim() + (p.content.length > 30 ? '...' : ''),
      stream: p.stream || 'General',
      createdAt: p.createdAt,
      status: p.status
    })),
    ...rawImages.map((i: any) => ({
      id: i.id,
      type: "IMAGE" as const,
      title: i.prompt.slice(0, 30).trim() + (i.prompt.length > 30 ? '...' : ''),
      stream: i.stream || 'General',
      createdAt: i.createdAt,
      status: i.status
    })),
    ...rawVideos.map((v: any) => ({
      id: v.id,
      type: "VIDEO" as const,
      title: v.title.slice(0, 30).trim() + (v.title.length > 30 ? '...' : ''),
      stream: 'General',
      createdAt: v.createdAt,
      status: v.status
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);

  const recentGenerations = allGenerations.map(gen => ({
    id: gen.id,
    type: gen.type,
    title: gen.title,
    stream: gen.stream,
    timeAgo: getTimeAgo(gen.createdAt),
    status: gen.status
  }));
  
  const stats = {
    posts: postsCount,
    images: imagesCount,
    videos: videosCount
  };

  return <DashboardClient data={{ stats, recentGenerations }} />;
}

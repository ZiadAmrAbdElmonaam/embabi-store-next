import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const thumbnails = await prisma.heroThumbnail.findMany({
      orderBy: { order: 'asc' },
      take: 4,
    });

    const response = NextResponse.json({ thumbnails });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Error fetching hero thumbnails:', error);
    return NextResponse.json({ thumbnails: [], error: 'Failed to fetch' }, { status: 500 });
  }
}

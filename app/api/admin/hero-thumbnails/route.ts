import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { requireCsrfOrReject } from '@/lib/csrf';

// GET - fetch all hero thumbnails (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thumbnails = await prisma.heroThumbnail.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ thumbnails });
  } catch (error) {
    console.error('Error fetching hero thumbnails:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// PUT - upsert all 4 hero thumbnails (admin)
export async function PUT(request: Request) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const items = body.thumbnails as Array<{ order: number; url: string; linkUrl?: string | null }>;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'thumbnails array required' }, { status: 400 });
    }

    const slotOrders = [1, 2, 3, 4];
    const validItems = items
      .filter((item) => item.url && item.order >= 1 && item.order <= 4)
      .slice(0, 4);

    await prisma.$transaction(async (tx) => {
      for (const order of slotOrders) {
        const item = validItems.find((i) => i.order === order);
        if (item) {
          await tx.heroThumbnail.upsert({
            where: { order },
            create: { url: item.url, order, linkUrl: item.linkUrl ?? null },
            update: { url: item.url, linkUrl: item.linkUrl ?? null },
          });
        } else {
          await tx.heroThumbnail.deleteMany({ where: { order } });
        }
      }
    });

    const thumbnails = await prisma.heroThumbnail.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ thumbnails });
  } catch (error) {
    console.error('Error updating hero thumbnails:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

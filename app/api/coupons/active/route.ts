import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isEnabled: true,
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } }
        ]
      },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        name: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

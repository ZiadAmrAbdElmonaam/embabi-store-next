import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const couponCookie = cookieStore.get('coupon')?.value;

    if (!couponCookie) {
      return NextResponse.json({ coupon: null });
    }

    const cookieData = JSON.parse(couponCookie);
    const couponId = cookieData?.id;

    // Fetch full coupon from DB to get minimumOrderAmount and other fields
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: {
          id: true,
          code: true,
          type: true,
          value: true,
          minimumOrderAmount: true,
        },
      });
      if (coupon) {
        return NextResponse.json({ coupon });
      }
    }

    // Fallback to cookie data if DB lookup fails (e.g. coupon deleted)
    return NextResponse.json({ coupon: cookieData });
  } catch (error) {
    console.error('Error fetching current coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the coupon' },
      { status: 500 }
    );
  }
} 
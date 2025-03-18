import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { authOptions } from '../../auth/auth-options';

export async function POST(req: NextRequest) {
  try {
    // Check authentication (optional - if you want to track coupon usage per user)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get request body
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    // Find the coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isEnabled: true,
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } }
        ]
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 });
    }

    // Check if user has reached usage limit (if userLimit is set and user is logged in)
    if (coupon.userLimit && userId) {
      const userUsageCount = await prisma.order.count({
        where: {
          userId,
          couponId: coupon.id
        }
      });

      if (userUsageCount >= coupon.userLimit) {
        return NextResponse.json({ 
          error: `This coupon has expired` 
        }, { status: 400 });
      }
    }

    // We don't need to check for cart items here since they're in localStorage
    // Just store the coupon in cookies for later use during checkout
    const cookieStore = await cookies();
    cookieStore.set('coupon', JSON.stringify({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value
    }), {
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
    });

    return NextResponse.json({
      message: 'Coupon applied successfully',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 
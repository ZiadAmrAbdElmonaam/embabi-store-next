import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth-options";
import { requireCsrfOrReject } from "@/lib/csrf";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all coupons
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.code || !data.type || data.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        type: data.type,
        value: parseFloat(data.value),
        endDate: data.endDate ? new Date(data.endDate) : null,
        userLimit: data.userLimit ? parseInt(data.userLimit) : null,
        minimumOrderAmount: data.minimumOrderAmount != null && data.minimumOrderAmount !== '' ? parseFloat(data.minimumOrderAmount) : null,
        isEnabled: data.isEnabled !== undefined ? Boolean(data.isEnabled) : true,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.code || !data.type || data.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Check if updated code already exists (if code is changed)
    if (
      data.code !== existingCoupon.code &&
      await prisma.coupon.findUnique({ where: { code: data.code } })
    ) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        type: data.type,
        value: parseFloat(data.value),
        endDate: data.endDate ? new Date(data.endDate) : null,
        userLimit: data.userLimit ? parseInt(data.userLimit) : null,
        isEnabled: data.isEnabled !== undefined ? Boolean(data.isEnabled) : true,
      },
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    // Check if the coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Check if coupon is used in any orders
    if (existingCoupon.orders.length > 0) {
      return NextResponse.json(
        { 
          error: 'Coupon cannot be deleted because it is used in orders',
          orderCount: existingCoupon.orders.length 
        },
        { status: 400 }
      );
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendOrderStatusEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, comment } = await request.json();
    
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            comment,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: true,
      },
    });

    // Send status update email
    await sendOrderStatusEmail(order.user.email, {
      id: order.id,
      status: status.toLowerCase(),
      shippingName: order.shippingName,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 
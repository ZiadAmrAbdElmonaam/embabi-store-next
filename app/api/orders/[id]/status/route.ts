import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { sendOrderStatusEmail } from '@/lib/email';
import { OrderStatus } from "@prisma/client";
import { authOptions } from "../../../auth/auth-options";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, comment } = await request.json();
    
    const order = await prisma.order.update({
      where: { id: context.params.id },
      data: {
        status: status as OrderStatus,
        statusHistory: {
          create: {
            status: status as OrderStatus,
            comment,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Send email notification
    try {
      await sendOrderStatusEmail(order.user.email, {
        id: order.id,
        status: status.toLowerCase(),
        shippingName: order.user.name ?? 'Customer',
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
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
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 
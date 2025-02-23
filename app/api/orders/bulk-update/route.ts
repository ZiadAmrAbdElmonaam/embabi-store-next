import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { sendOrderStatusEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds, status } = await request.json();

    const orders = await prisma.$transaction(
      orderIds.map((id: string) =>
        prisma.order.update({
          where: { id },
          data: {
            status,
            statusHistory: {
              create: {
                status,
                comment: 'Bulk status update',
              },
            },
          },
          include: {
            user: true,
          },
        })
      )
    );

    // Send email notifications
    for (const order of orders) {
      await sendOrderStatusEmail(
        order.user.email,
        {
          id: order.id,
          status,
          shippingName: order.user.name || 'Customer' // Assuming user has a name field
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk order update error:', error);
    return NextResponse.json(
      { error: 'Failed to update orders' },
      { status: 500 }
    );
  }
} 
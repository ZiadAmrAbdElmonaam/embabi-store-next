import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { OrderStatus } from "@prisma/client";
import { sendOrderUpdateEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role === 'ADMIN') {
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
      await sendOrderUpdateEmail(
        order.user.email,
        order.id,
        status,
        'Your order status has been updated'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update orders' },
      { status: 500 }
    );
  }
} 
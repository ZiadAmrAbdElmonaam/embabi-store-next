import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Find the pending order for the user
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'No active cart found' }, { status: 404 });
    }

    // Remove the item from the order
    await prisma.orderItem.deleteMany({
      where: {
        orderId: order.id,
        productId: productId
      }
    });

    // If this was the last item, delete the order
    if (order.items.length === 1 && order.items[0].productId === productId) {
      await prisma.order.delete({
        where: {
          id: order.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove item from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
} 
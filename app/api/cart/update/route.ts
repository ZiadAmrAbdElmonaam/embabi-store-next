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
    const { productId, quantity } = body;

    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Find the pending order for the user
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'No active cart found' }, { status: 404 });
    }

    // Find the item to update
    const item = order.items.find(item => item.productId === productId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }

    // Check if requested quantity is available
    if (quantity > item.product.stock) {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 });
    }

    // Update the item quantity
    await prisma.orderItem.update({
      where: {
        id: item.id
      },
      data: {
        quantity
      }
    });

    // Update order total
    const updatedTotal = order.items.reduce((total, currentItem) => {
      const itemPrice = currentItem.productId === productId
        ? quantity * Number(currentItem.price)
        : currentItem.quantity * Number(currentItem.price);
      return total + itemPrice;
    }, 0);

    await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        total: updatedTotal
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
} 
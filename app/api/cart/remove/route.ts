import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Find the pending order
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
      return new NextResponse("Cart not found", { status: 404 });
    }

    // Find and delete the item
    const item = order.items.find(item => item.productId === productId);
    if (!item) {
      return new NextResponse("Item not found in cart", { status: 404 });
    }

    await prisma.orderItem.delete({
      where: { id: item.id }
    });

    // Update order total
    const updatedItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { product: true }
    });

    const total = updatedItems.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    await prisma.order.update({
      where: { id: order.id },
      data: { total }
    });

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.error("[CART_REMOVE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
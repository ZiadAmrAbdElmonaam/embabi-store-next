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
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Check if product exists and has enough stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    if (product.stock < quantity) {
      return new NextResponse("Not enough stock", { status: 400 });
    }

    // Find or create a pending order for the user
    let order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      },
      include: {
        items: true
      }
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          userId: session.user.id,
          status: 'PENDING',
          total: 0, // Will be updated later
          shippingName: '',
          shippingPhone: '',
          shippingAddress: '',
          shippingCity: '',
        },
        include: {
          items: true
        }
      });
    }

    // Check if product is already in cart
    const existingItem = order.items.find(item => item.productId === productId);

    if (existingItem) {
      // Update quantity if product already in cart
      await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Add new item to cart
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: productId,
          quantity: quantity,
          price: product.price
        }
      });
    }

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
    console.error("[CART_ADD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
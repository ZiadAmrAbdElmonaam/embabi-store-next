import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ items: [] });
    }

    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: {
                  select: {
                    color: true,
                    quantity: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ items: [] });
    }

    // Format items for the cart
    const items = order.items.map(item => ({
      id: item.productId,
      name: item.product.name,
      price: Number(item.product.price),
      salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
      images: item.product.images,
      quantity: item.quantity,
      selectedColor: null, // This will be managed client-side
      availableColors: item.product.variants.map(variant => ({
        color: variant.color,
        quantity: variant.quantity
      }))
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    return NextResponse.json({ items: [] });
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            color: true,
            storageId: true,
            product: {
              select: {
                id: true,
                name: true,
                variants: true,
                storages: {
                  select: {
                    id: true,
                    size: true,
                    price: true,
                    variants: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize the orders to convert Decimal objects to numbers
    const serializedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
      discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          storages: item.product.storages.map(storage => ({
            ...storage,
            price: Number(storage.price),
          })),
        },
      })),
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 
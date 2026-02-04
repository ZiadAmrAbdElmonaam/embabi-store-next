import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
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
                      units: true,
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
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);

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

    return NextResponse.json({
      orders: serializedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { OrderStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      );
    }

    if (existingOrder.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        {
          error: `Cannot cancel order with status: ${existingOrder.status}. Only PENDING orders can be cancelled.`,
        },
        { status: 400 }
      );
    }

    const txCallback = async (tx: typeof prisma) => {
      const orderWithItems = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  storages: { include: { units: true } },
                  variants: true,
                },
              },
            },
          },
        },
      });

      if (!orderWithItems) {
        throw new Error('Order not found');
      }

      for (const orderItem of orderWithItems.items) {
        if (orderItem.storageId) {
          const storage = orderItem.product.storages.find((s) => s.id === orderItem.storageId);
          if (storage?.units) {
            const unit = orderItem.unitId
              ? storage.units.find((u) => u.id === orderItem.unitId)
              : orderItem.color
                ? storage.units.find((u) => u.color === orderItem.color)
                : storage.units[0];
            if (unit) {
              await tx.productStorageUnit.update({
                where: { id: unit.id },
                data: { stock: { increment: orderItem.quantity } },
              });
            }
          }
        } else {
          if (orderItem.color) {
            const variant = orderItem.product.variants.find((v) => v.color === orderItem.color);
            if (variant) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { quantity: { increment: orderItem.quantity } },
              });
            }
          }
          await tx.product.update({
            where: { id: orderItem.productId },
            data: { stock: { increment: orderItem.quantity } },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          statusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              comment: 'Order cancelled by customer - stock restored',
            },
          },
        },
        include: {
          statusHistory: { orderBy: { createdAt: 'desc' } },
          items: { include: { product: { select: { name: true } } } },
        },
      });

      return updatedOrder;
    };

    const cancelledOrder = await prisma.$transaction(txCallback, {
      maxWait: 10000,
      timeout: 20000,
    });

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: {
        id: cancelledOrder.id,
        status: cancelledOrder.status,
        updatedAt: cancelledOrder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

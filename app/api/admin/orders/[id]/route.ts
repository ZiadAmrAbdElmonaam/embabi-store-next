import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction([
      // Delete status history
      prisma.statusUpdate.deleteMany({
        where: { orderId },
      }),
      // Delete order items
      prisma.orderItem.deleteMany({
        where: { orderId },
      }),
      // Delete the order
      prisma.order.delete({
        where: { id: orderId },
      }),
    ]);

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalOrders,
      totalProducts,
      totalUsers,
      deliveredOrders,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        where: {
          status: 'DELIVERED',
        },
        select: {
          total: true,
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Calculate total revenue: sum of delivered orders + shipping costs
    const deliveredOrdersTotal = deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const deliveredOrdersCount = deliveredOrders.length;
    const shippingCost = deliveredOrdersCount * 300; // 300 per delivered order
    const totalRevenue = deliveredOrdersTotal + shippingCost;

    const stats = {
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      deliveredOrdersCount,
      shippingCost,
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map(({ status, _count }) => [status, _count])
      ),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 
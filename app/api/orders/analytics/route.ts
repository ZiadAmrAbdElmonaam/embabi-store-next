import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      revenueByDay,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.order.groupBy({
        by: ['createdAt'],
        _sum: {
          total: true,
        },
        _count: true,
      }),
    ]);

    const analytics = {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total) || 0,
      averageOrderValue:
        (Number(totalRevenue._sum.total) || 0) / (totalOrders || 1),
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map((item) => [item.status, item._count])
      ),
      revenueByDay: revenueByDay.map((item) => ({
        date: item.createdAt.toISOString().split('T')[0],
        revenue: Number(item._sum.total),
        orders: item._count,
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
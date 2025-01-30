import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { stringify } from 'csv-stringify/sync';

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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const csvData = orders.map((order) => ({
      id: order.id,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: order.status,
      total: order.total,
      items: order.items
        .map((item) => `${item.quantity}x ${item.product.name}`)
        .join(', '),
      createdAt: order.createdAt,
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: {
        id: 'Order ID',
        customerName: 'Customer Name',
        customerEmail: 'Customer Email',
        status: 'Status',
        total: 'Total',
        items: 'Items',
        createdAt: 'Date',
      },
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=orders-${new Date()
          .toISOString()
          .split('T')[0]}.csv`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
} 
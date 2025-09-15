import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.order.count({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Failed to fetch order count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order count' },
      { status: 500 }
    );
  }
}


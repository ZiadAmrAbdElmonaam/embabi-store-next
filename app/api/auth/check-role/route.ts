import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    return NextResponse.json({ role: user?.role });
  } catch (error) {
    console.error('Error checking role:', error);
    return NextResponse.json({ role: null }, { status: 500 });
  }
} 
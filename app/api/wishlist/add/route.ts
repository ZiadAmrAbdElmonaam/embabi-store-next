import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // For non-authenticated users, return success
  // This allows the client to use local storage
  if (!session?.user) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get or create wishlist for user
    let wishlist = await prisma.wishlist.findFirst({
      where: { userId: session.user.id },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: session.user.id },
      });
    }

    // Add product to wishlist
    await prisma.wishlist.update({
      where: { id: wishlist.id },
      data: {
        products: {
          connect: { id: productId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WISHLIST_ADD]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
} 
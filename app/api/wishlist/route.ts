import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  // For non-authenticated users, return empty items array
  // This allows the client to use local storage
  if (!session?.user) {
    return NextResponse.json({ items: [] });
  }

  try {
    const wishlistItems = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            images: true,
          },
        },
      },
    });

    const items = wishlistItems?.products.map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images,
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[WISHLIST_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // For non-authenticated users, return success
    // This allows the client to use local storage
    if (!session?.user) {
      return NextResponse.json({ success: true });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: { products: true },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          products: {
            connect: { id: productId },
          },
        },
        include: { products: true },
      });
    } else {
      const hasProduct = wishlist.products.some(p => p.id === productId);
      if (hasProduct) {
        wishlist = await prisma.wishlist.update({
          where: { id: wishlist.id },
          data: {
            products: {
              disconnect: { id: productId },
            },
          },
          include: { products: true },
        });
      } else {
        wishlist = await prisma.wishlist.update({
          where: { id: wishlist.id },
          data: {
            products: {
              connect: { id: productId },
            },
          },
          include: { products: true },
        });
      }
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
} 
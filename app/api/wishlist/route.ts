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

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        products: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId: session.user.id,
        },
        include: {
          products: {
            include: {
              category: true,
            },
          },
        },
      });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
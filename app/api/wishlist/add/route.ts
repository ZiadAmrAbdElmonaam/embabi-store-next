import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: { products: true }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          products: {
            connect: { id: productId }
          }
        },
        include: { products: true }
      });
    } else {
      // Check if product is already in wishlist
      const isProductInWishlist = wishlist.products.some(p => p.id === productId);

      if (isProductInWishlist) {
        // Remove product from wishlist
        await prisma.wishlist.update({
          where: { userId: session.user.id },
          data: {
            products: {
              disconnect: { id: productId }
            }
          }
        });
      } else {
        // Add product to wishlist
        await prisma.wishlist.update({
          where: { userId: session.user.id },
          data: {
            products: {
              connect: { id: productId }
            }
          }
        });
      }
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.error("[WISHLIST_ADD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product is used in any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId },
    });

    if (orderItems) {
      return NextResponse.json({ 
        error: 'Cannot delete product because it is used in orders. Consider marking it as out of stock instead.' 
      }, { status: 400 });
    }

    // First delete associated records with no cascade set up
    await prisma.$transaction(async (tx) => {
      // Delete product variants (if any)
      await tx.productVariant.deleteMany({
        where: { productId },
      });

      // Delete product details (if any)
      await tx.productDetail.deleteMany({
        where: { productId },
      });

      // Remove product from all wishlists - delete wishlist items
      await tx.wishlistItem.deleteMany({
        where: { productId }
      });

      // Also remove from anonymous wishlists
      await tx.anonymousWishlistItem.deleteMany({
        where: { productId }
      });

      // Remove product from all carts
      await tx.cartItem.deleteMany({
        where: { productId }
      });

      // Also remove from anonymous carts
      await tx.anonymousCartItem.deleteMany({
        where: { productId }
      });

      // Delete reviews
      await tx.review.deleteMany({
        where: { productId },
      });

      // Delete the product itself
      await tx.product.delete({
        where: { id: productId },
      });
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Provide more specific error message
    let errorMessage = 'Failed to delete product';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
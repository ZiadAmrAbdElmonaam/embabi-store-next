import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { requireCsrfOrReject } from "@/lib/csrf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: true,
        details: true,
        storages: {
          include: { units: true },
        },
      },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const serialized = {
      ...product,
      price: product.price != null ? Number(product.price) : null,
      salePrice: product.salePrice != null ? Number(product.salePrice) : null,
      discountPrice: product.discountPrice != null ? Number(product.discountPrice) : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      saleEndDate: product.saleEndDate?.toISOString() ?? null,
      storages: product.storages.map(s => ({
        ...s,
        price: Number(s.price),
        saleEndDate: s.saleEndDate?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        units: s.units.map(u => ({
          ...u,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })),
      })),
    };
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    if (!(await isAdminRequest(request))) {
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
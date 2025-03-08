import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export async function POST(request: Request) {
  try {
    // Check for admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Only administrators can reset the database.' }, { status: 401 });
    }

    // Check for confirmation in request body
    const body = await request.json();
    if (!body.confirm || body.confirm !== 'RESET_DATABASE') {
      return NextResponse.json({ 
        error: 'Confirmation required. Send {"confirm": "RESET_DATABASE"} to confirm this destructive action.' 
      }, { status: 400 });
    }

    // Execute the reset in a transaction to maintain data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all OrderItems first (they reference both orders and products)
      const deletedOrderItems = await tx.orderItem.deleteMany({});
      
      // 2. Delete all OrderStatusHistory
      const deletedStatusUpdates = await tx.statusUpdate.deleteMany({});
      
      // 3. Delete all Orders
      const deletedOrders = await tx.order.deleteMany({});
      
      // 4. Delete all product-related entities
      // 4.1 Delete ProductVariants
      const deletedVariants = await tx.productVariant.deleteMany({});
      
      // 4.2 Delete ProductDetails
      const deletedDetails = await tx.productDetail.deleteMany({});
      
      // 4.3 Delete Reviews
      const deletedReviews = await tx.review.deleteMany({});
      
      // 5. Clear product references from wishlists (don't delete wishlists)
      const wishlists = await tx.wishlist.findMany({
        select: { id: true }
      });
      
      for (const wishlist of wishlists) {
        await tx.wishlist.update({
          where: { id: wishlist.id },
          data: { 
            products: { set: [] } // Clear the products array
          }
        });
      }
      
      // 6. Delete all Products
      const deletedProducts = await tx.product.deleteMany({});
      
      return {
        deletedOrderItems: deletedOrderItems.count,
        deletedStatusUpdates: deletedStatusUpdates.count,
        deletedOrders: deletedOrders.count,
        deletedVariants: deletedVariants.count,
        deletedDetails: deletedDetails.count,
        deletedReviews: deletedReviews.count,
        clearedWishlists: wishlists.length,
        deletedProducts: deletedProducts.count
      };
    });

    return NextResponse.json({ 
      message: 'Database reset successful', 
      result 
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    
    let errorMessage = 'Failed to reset database';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
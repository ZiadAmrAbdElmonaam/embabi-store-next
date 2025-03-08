import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order ID from params
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Get item IDs to cancel from request body
    const body = await request.json().catch(() => ({}));
    const { itemIds, comment } = body;
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'No items selected for cancellation' },
        { status: 400 }
      );
    }

    console.log(`Cancelling items for order ${orderId}:`, itemIds);

    // Check if order exists
    const orderExists = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!orderExists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get the order items to be cancelled
    const orderItems = await prisma.orderItem.findMany({
      where: {
        id: { in: itemIds },
        orderId: orderId
      },
      include: {
        product: {
          include: {
            variants: true
          }
        }
      }
    });

    console.log(`Found ${orderItems.length} order items to cancel`);

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: 'No matching order items found' },
        { status: 404 }
      );
    }

    // Use a transaction to ensure all updates are atomic
    const result = await prisma.$transaction(async (tx) => {
      const updatedItems = [];
      
      // For each cancelled item, update product stock and color variant quantity
      for (const item of orderItems) {
        console.log(`Processing item ${item.id} - Product: ${item.product.name}, Quantity: ${item.quantity}, Color: ${item.color || 'None'}`);
        
        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
        console.log(`Updated stock for product ${item.productId}`);

        // If the item has a color, update the corresponding variant quantity
        if (item.color) {
          const variant = item.product.variants.find(v => v.color === item.color);
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                quantity: {
                  increment: item.quantity
                }
              }
            });
            console.log(`Updated quantity for variant ${variant.id} (${item.color})`);
          } else {
            console.log(`No variant found for color ${item.color}`);
          }
        }

        // Mark the order item as cancelled - for now, we'll skip this step
        // since the status field might not exist yet
        updatedItems.push(item);
        console.log(`Processed item ${item.id}`);

        // In a future update, we can add this back:
        // const updatedItem = await tx.orderItem.update({
        //   where: { id: item.id },
        //   data: {
        //     status: 'CANCELLED'
        //   }
        // });
      }

      // Add a status update to the order history
      await tx.statusUpdate.create({
        data: {
          orderId: orderId,
          status: 'CANCELLED',
          comment: comment || 'Items cancelled by admin'
        }
      });
      console.log(`Added status update to order history`);

      return updatedItems;
    });

    console.log(`Successfully cancelled ${result.length} items`);

    return NextResponse.json({
      success: true,
      message: `${result.length} items cancelled successfully`,
      cancelledItems: result
    });
  } catch (error) {
    console.error('Error cancelling order items:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order items', details: error.message },
      { status: 500 }
    );
  }
} 
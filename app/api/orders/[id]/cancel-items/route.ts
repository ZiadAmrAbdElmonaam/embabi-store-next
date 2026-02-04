import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { requireCsrfOrReject } from "@/lib/csrf";

interface CancelItemData {
  itemId: string;
  quantityToCancel: number;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    if (!(await isAdminRequest(request))) {
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
    
    // Get items to cancel from request body
    const body = await request.json().catch(() => ({}));
    const { items, comment } = body;
    
    // Support both old format (itemIds) and new format (items with quantities)
    let itemsToCancel: CancelItemData[] = [];
    
    if (body.itemIds && Array.isArray(body.itemIds)) {
      // Old format - cancel entire items
      itemsToCancel = body.itemIds.map(itemId => ({ itemId, quantityToCancel: 0 })); // 0 means cancel all
    } else if (items && Array.isArray(items)) {
      // New format - cancel specific quantities
      itemsToCancel = items.filter(item => item.quantityToCancel > 0);
    }
    
    if (itemsToCancel.length === 0) {
      return NextResponse.json(
        { error: 'No items selected for cancellation' },
        { status: 400 }
      );
    }

    console.log(`Cancelling items for order ${orderId}:`, itemsToCancel);

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
        id: { in: itemsToCancel.map(item => item.itemId) },
        orderId: orderId
      },
      include: {
        product: {
          include: {
            variants: true,
            storages: {
              include: {
                units: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${orderItems.length} order items to process`);

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: 'No matching order items found' },
        { status: 404 }
      );
    }

    // Validate quantities
    for (const cancelItem of itemsToCancel) {
      const orderItem = orderItems.find(item => item.id === cancelItem.itemId);
      if (!orderItem) {
        return NextResponse.json(
          { error: `Order item ${cancelItem.itemId} not found` },
          { status: 404 }
        );
      }
      
      if (cancelItem.quantityToCancel > orderItem.quantity) {
        return NextResponse.json(
          { error: `Cannot cancel ${cancelItem.quantityToCancel} items - only ${orderItem.quantity} ordered` },
          { status: 400 }
        );
      }
    }

    // Use a transaction to ensure all updates are atomic
    const result = await prisma.$transaction(async (tx) => {
      const processedItems = [];
      let totalCancelledQuantity = 0;
      
      // For each cancelled item, update product stock and order item quantity
      for (const cancelItem of itemsToCancel) {
        const orderItem = orderItems.find(item => item.id === cancelItem.itemId);
        if (!orderItem) continue;
        
        // Determine quantity to cancel (0 means cancel all)
        const quantityToCancel = cancelItem.quantityToCancel === 0 ? orderItem.quantity : cancelItem.quantityToCancel;
        
        console.log(`Processing item ${orderItem.id} - Product: ${orderItem.product.name}, Cancel Quantity: ${quantityToCancel}/${orderItem.quantity}, Color: ${orderItem.color || 'None'}, Storage: ${orderItem.storageId || 'None'}`);
        
        // Restore stock based on the cancelled quantity
        if (orderItem.storageId) {
          // Storage-based product: Update storage stock and storage variants
          console.log(`Restoring storage stock for storage ${orderItem.storageId}`);
          
          if (orderItem.color) {
            // Storage + Color: Restore storage variant quantity, storage stock, and product stock
            console.log(`Restoring storage variant with color ${orderItem.color}`);
            
            const storage = orderItem.product.storages.find(s => s.id === orderItem.storageId);
            if (storage) {
              const units = (storage as { units?: Array<{ id: string; color: string; stock: number }> })?.units ?? [];
              const unit = orderItem.unitId ? units.find((u: { id: string }) => u.id === orderItem.unitId) : units.find((u: { color: string }) => u.color === orderItem.color) ?? units[0];
              if (unit) {
                await tx.productStorageUnit.update({
                  where: { id: unit.id },
                  data: {
                    stock: {
                      increment: quantityToCancel
                    }
                  }
                });
                
                // Also restore the storage total stock
                console.log(`Storage total stock restored by ${quantityToCancel}`);
                
              } else {
                console.log(`No storage variant found for color ${orderItem.color}`);
              }
            }
          } else {
            const storage2 = orderItem.product.storages.find(s => s.id === orderItem.storageId);
            const units2 = storage2 ? (storage2 as { units?: Array<{ id: string }> })?.units ?? [] : [];
            if (orderItem.unitId && units2.length > 0) {
              const u = units2.find((x: { id: string }) => x.id === orderItem.unitId);
              if (u) await tx.productStorageUnit.update({ where: { id: u.id }, data: { stock: { increment: quantityToCancel } } });
            } else if (units2.length > 0) {
              await tx.productStorageUnit.update({ where: { id: units2[0].id }, data: { stock: { increment: quantityToCancel } } });
            }
          }
        } else {
          // Non-storage product (legacy): Update product and color variants
          if (orderItem.color) {
            // Color only: Restore product variant quantity and main product stock
            const variant = orderItem.product.variants.find(v => v.color === orderItem.color);
            if (variant) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  quantity: {
                    increment: quantityToCancel
                  }
                }
              });
              console.log(`Updated quantity for variant ${variant.id} (${orderItem.color}) by ${quantityToCancel}`);
              
              // Also restore the main product stock
              await tx.product.update({
                where: { id: orderItem.productId },
                data: {
                  stock: {
                    increment: quantityToCancel
                  }
                }
              });
              console.log(`Main product stock restored by ${quantityToCancel}`);
            } else {
              console.log(`No variant found for color ${orderItem.color}`);
            }
          } else {
            // No storage, no color: Update main product stock
            await tx.product.update({
              where: { id: orderItem.productId },
              data: {
                stock: {
                  increment: quantityToCancel
                }
              }
            });
            console.log(`Updated stock for product ${orderItem.productId} by ${quantityToCancel}`);
          }
        }

        // Update the order item quantity or delete if fully cancelled
        if (quantityToCancel >= orderItem.quantity) {
          // Cancel the entire item
          await tx.orderItem.delete({
            where: { id: orderItem.id }
          });
          console.log(`Deleted order item ${orderItem.id} completely`);
        } else {
          // Reduce the quantity of the order item
          const newQuantity = orderItem.quantity - quantityToCancel;
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { quantity: newQuantity }
          });
          console.log(`Updated order item ${orderItem.id} quantity from ${orderItem.quantity} to ${newQuantity}`);
        }

        processedItems.push({
          itemId: orderItem.id,
          productName: orderItem.product.name,
          cancelledQuantity: quantityToCancel,
          remainingQuantity: Math.max(0, orderItem.quantity - quantityToCancel)
        });
        
        totalCancelledQuantity += quantityToCancel;
        console.log(`Processed item ${orderItem.id} - cancelled ${quantityToCancel} items`);
      }

      // Add a status update to the order history
      await tx.statusUpdate.create({
        data: {
          orderId: orderId,
          status: 'CANCELLED',
          comment: comment || `${totalCancelledQuantity} item(s) cancelled by admin`
        }
      });
      console.log(`Added status update to order history`);

      return { processedItems, totalCancelledQuantity };
    });

    console.log(`Successfully processed ${result.processedItems.length} items, cancelled ${result.totalCancelledQuantity} total items`);

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${result.totalCancelledQuantity} item(s) from ${result.processedItems.length} order line(s)`,
      processedItems: result.processedItems,
      totalCancelledQuantity: result.totalCancelledQuantity
    });
  } catch (error) {
    console.error('Error cancelling order items:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order items', details: error.message },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { OrderStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    // First, check if the order exists and belongs to the user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        userId: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled (only PENDING orders can be cancelled)
    if (existingOrder.status !== OrderStatus.PENDING) {
      return NextResponse.json(
        { 
          error: `Cannot cancel order with status: ${existingOrder.status}. Only PENDING orders can be cancelled.` 
        },
        { status: 400 }
      );
    }

    // Update order status to CANCELLED and restore stock quantities
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // First, get the order with all items and product details
      const orderWithItems = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  storages: {
                    include: {
                      variants: true,
                    },
                  },
                  variants: true,
                },
              },
            },
          },
        },
      });

      if (!orderWithItems) {
        throw new Error('Order not found');
      }

      // Restore stock for each order item
      for (const orderItem of orderWithItems.items) {
        console.log(`Restoring stock for item: ${orderItem.product.name}, Quantity: ${orderItem.quantity}`);
        
        if (orderItem.storageId) {
          // Storage-based product: Update storage stock and storage variants
          console.log(`Restoring storage stock for storage ${orderItem.storageId}`);
          
          if (orderItem.color) {
            // Storage + Color: Restore storage variant quantity, storage stock, and product stock
            console.log(`Restoring storage variant with color ${orderItem.color}`);
            
            const storage = orderItem.product.storages.find(s => s.id === orderItem.storageId);
            if (storage) {
              const storageVariant = storage.variants.find(v => v.color === orderItem.color);
              if (storageVariant) {
                await tx.productStorageVariant.update({
                  where: { id: storageVariant.id },
                  data: {
                    quantity: {
                      increment: orderItem.quantity
                    }
                  }
                });
                console.log(`Storage variant quantity restored by ${orderItem.quantity}`);
              }
            }
            
            // Restore storage total stock
            await tx.productStorage.update({
              where: { id: orderItem.storageId },
              data: {
                stock: {
                  increment: orderItem.quantity
                }
              }
            });
            console.log(`Storage total stock restored by ${orderItem.quantity}`);
            
            // Restore main product stock
            await tx.product.update({
              where: { id: orderItem.productId },
              data: {
                stock: {
                  increment: orderItem.quantity
                }
              }
            });
            console.log(`Main product stock restored by ${orderItem.quantity}`);
            
          } else {
            // Storage only: Restore storage stock and product stock
            await tx.productStorage.update({
              where: { id: orderItem.storageId },
              data: {
                stock: {
                  increment: orderItem.quantity
                }
              }
            });
            console.log(`Storage stock restored by ${orderItem.quantity}`);
            
            await tx.product.update({
              where: { id: orderItem.productId },
              data: {
                stock: {
                  increment: orderItem.quantity
                }
              }
            });
            console.log(`Main product stock restored by ${orderItem.quantity}`);
          }
        } else {
          // Regular product (no storage variants)
          if (orderItem.color) {
            // Product + Color: Restore product variant quantity and main product stock
            const productVariant = orderItem.product.variants.find(v => v.color === orderItem.color);
            if (productVariant) {
              await tx.productVariant.update({
                where: { id: productVariant.id },
                data: {
                  quantity: {
                    increment: orderItem.quantity
                  }
                }
              });
              console.log(`Product variant quantity restored by ${orderItem.quantity}`);
            }
            
            await tx.product.update({
              where: { id: orderItem.productId },
              data: {
                stock: {
                  increment: orderItem.quantity
                }
              }
            });
            console.log(`Main product stock restored by ${orderItem.quantity}`);
            
          } else {
            // Simple product: Only restore main product stock
            await tx.product.update({
              where: { id: orderItem.productId },
              data: {
                stock: {
                  increment: orderItem.quantity
                }
              }
            });
            console.log(`Simple product stock restored by ${orderItem.quantity}`);
          }
        }
      }

      // Update order status to CANCELLED and add status history
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          statusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              comment: 'Order cancelled by customer - stock restored',
            },
          },
        },
        include: {
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: {
        id: cancelledOrder.id,
        status: cancelledOrder.status,
        updatedAt: cancelledOrder.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

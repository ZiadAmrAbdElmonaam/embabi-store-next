
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { v2 as cloudinary } from 'cloudinary';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { requireCsrfOrReject } from "@/lib/csrf";
import { logger, publicErrorMessage } from "@/lib/logger";

// Add these interfaces at the top of the file
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  selectedColor?: string | null;
  storageId?: string | null;
  unitId?: string | null;
}

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

interface CouponInfo {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumOrderAmount?: number | null;
}

export async function POST(request: Request) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;

    console.log("Starting order creation process...");
    
    // Check if the site is in maintenance mode
    console.log("Checking maintenance mode status...");
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: "site-settings" }
    });

    if (siteSettings?.maintenanceMode) {
      console.log("Site is in maintenance mode. Blocking order creation.");
      return NextResponse.json({ 
        error: siteSettings.maintenanceMessage || 'Site is currently under maintenance. Please try again later.'
      }, { status: 503 });
    }
    
    const session = await getServerSession(authOptions);
    console.log("Session retrieved:", session ? "Valid" : "Invalid");

    if (!session || !session.user.id) {
      console.log("Unauthorized access attempt - no valid session");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("User ID:", session.user.id);
    
    let formData;
    try {
      formData = await request.formData();
      console.log("Received FormData fields:", Array.from(formData.keys()));
    } catch (formError) {
      console.error("Failed to parse form data:", formError instanceof Error ? formError.message : String(formError));
      return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
    }

    // Parse items with safer error handling
    let items: OrderItem[] = [];
    try {
      console.log("Parsing items...");
      const itemsJson = formData.get('items');
      console.log("Items JSON type:", typeof itemsJson);
      if (typeof itemsJson !== 'string') {
        throw new Error(`Items not provided as string. Got: ${typeof itemsJson}`);
      }
      items = JSON.parse(itemsJson) as OrderItem[];
      console.log("Parsed items count:", items.length);
    } catch (error) {
      console.error('Failed to parse items:', error instanceof Error ? error.message : String(error));
      return NextResponse.json({ error: `Invalid items data` }, { status: 400 });
    }

    console.log("Processing payment method...");
    const paymentMethod = formData.get('paymentMethod');
    console.log("Payment method:", paymentMethod);

    // Parse shipping info with safer error handling
    let shippingInfo: ShippingInfo | null = null;
    try {
      console.log("Parsing shipping info...");
      const shippingJson = formData.get('shippingInfo');
      console.log("Shipping JSON type:", typeof shippingJson);
      if (typeof shippingJson !== 'string') {
        throw new Error(`Shipping info not provided as string. Got: ${typeof shippingJson}`);
      }
      shippingInfo = JSON.parse(shippingJson) as ShippingInfo;
      console.log("Shipping info parsed successfully");
    } catch (error) {
      console.error('Failed to parse shipping info:', error instanceof Error ? error.message : String(error));
      return NextResponse.json({ error: `Invalid shipping information` }, { status: 400 });
    }

    console.log("Processing total...");
    const totalStr = formData.get('total');
    console.log("Total string:", totalStr, "Type:", typeof totalStr);
    const total = typeof totalStr === 'string' ? Number(totalStr) : 0;
    console.log("Parsed total:", total);

    // Get discount amount if provided
    console.log("Processing discount amount...");
    const discountAmountStr = formData.get('discountAmount');
    const discountAmount = typeof discountAmountStr === 'string' ? Number(discountAmountStr) : 0;
    console.log("Discount amount:", discountAmount);

    // Check for coupon from cookies
    let couponData: CouponInfo | null = null;
    try {
      // First check if couponInfo was passed in the form
      const couponInfoStr = formData.get('couponInfo');
      if (typeof couponInfoStr === 'string') {
        couponData = JSON.parse(couponInfoStr) as CouponInfo;
        console.log("Coupon info from form:", couponData.code);
      } else {
        // Fall back to cookie if not in form
        const cookieStore = await cookies();
        const couponCookie = cookieStore.get('coupon')?.value;
        if (couponCookie) {
          couponData = JSON.parse(couponCookie) as CouponInfo;
          console.log("Applied coupon from cookie:", couponData.code);
        }
      }
    } catch (error) {
      console.error('Error parsing coupon data:', error);
      // Continue without coupon if error occurs
    }

    // Attribution (optional) - first-touch UTM and click ids from client
    const utmSource = typeof formData.get('utm_source') === 'string' ? formData.get('utm_source') as string : null;
    const utmMedium = typeof formData.get('utm_medium') === 'string' ? formData.get('utm_medium') as string : null;
    const utmCampaign = typeof formData.get('utm_campaign') === 'string' ? formData.get('utm_campaign') as string : null;
    const fbclid = typeof formData.get('fbclid') === 'string' ? formData.get('fbclid') as string : null;
    const gclid = typeof formData.get('gclid') === 'string' ? formData.get('gclid') as string : null;

    // Validate required fields
    console.log("Validating required fields...");
    
    if (!items?.length) {
      console.error('No items provided');
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    if (!shippingInfo?.name || !shippingInfo?.phone || !shippingInfo?.address || !shippingInfo?.city) {
      console.error('Missing required shipping information');
      return NextResponse.json({ error: 'Missing required shipping information' }, { status: 400 });
    }

    if (!total || total <= 0) {
      console.error('Invalid total amount');
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    // Validate coupon minimum order when coupon is applied
    if (couponData?.id) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponData.id },
        select: { minimumOrderAmount: true }
      });
      if (coupon?.minimumOrderAmount != null && Number(coupon.minimumOrderAmount) > 0) {
        const orderSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (orderSubtotal < Number(coupon.minimumOrderAmount)) {
          return NextResponse.json(
            { error: 'Your cart does not meet the minimum order amount for this coupon. Add more items or remove the coupon to proceed.' },
            { status: 400 }
          );
        }
      }
    }

    console.log("All required fields validated");

    // Validate product IDs and check stock availability (products must be in scope for transaction)
    console.log("Validating products and checking stock...");
    let products: { id: string; name: string; stock: number | null; storages: { id: string; units: { id: string; color: string; stock: number }[] }[]; variants: { color: string; quantity: number }[] }[];
    try {
      const productIds = items.map(item => item.id);
      console.log("Product IDs to validate:", productIds);
      
      // Fetch products with their variants and storages to check stock
      products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: true,
          storages: {
            include: {
              units: true
            }
          }
        }
      });
      console.log("Found existing products:", products.length);

      const existingProductIds = new Set(products.map(product => product.id));
      const invalidProductIds = productIds.filter(id => !existingProductIds.has(id));

      if (invalidProductIds.length > 0) {
        console.error('Invalid product IDs:', invalidProductIds);
        return NextResponse.json(
          { error: 'Some products in the order do not exist' },
          { status: 400 }
        );
      }
      
      // Check stock availability for each product, storage, and color variant
      for (const orderItem of items) {
        const product = products.find(p => p.id === orderItem.id);
        if (!product) {
          console.error(`Product ${orderItem.id} not found in database`);
          continue;
        }
        
        console.log(`Validating stock for product ${product.name} (ID: ${product.id})`);
        console.log(`- Has storages: ${product.storages.length > 0}`);
        console.log(`- Has variants: ${product.variants.length > 0}`);
        console.log(`- Order item storageId: ${orderItem.storageId}`);
        console.log(`- Order item selectedColor: ${orderItem.selectedColor}`);
        
        // Check stock based on storage selection
        if (orderItem.storageId && orderItem.storageId !== null) {
          // Storage-based product
          console.log(`Processing storage-based product with storageId: ${orderItem.storageId}`);
          const selectedStorage = product.storages.find(s => s.id === orderItem.storageId);
          if (!selectedStorage) {
            console.error(`Storage ${orderItem.storageId} not found for product ${product.id}`);
            return NextResponse.json(
              { error: `Selected storage not available for product: ${product.name}` },
              { status: 400 }
            );
          }
          
          const units = selectedStorage.units ?? [];
          const unit = orderItem.unitId
            ? units.find((u: { id: string }) => u.id === orderItem.unitId)
            : units.find((u: { color: string }) => u.color === orderItem.selectedColor);
          if (orderItem.selectedColor || orderItem.unitId) {
            if (!unit) {
              return NextResponse.json(
                { error: `Selected option not available for ${product.name}` },
                { status: 400 }
              );
            }
            if (unit.stock < orderItem.quantity) {
              return NextResponse.json(
                { error: `Insufficient stock for ${product.name}. Available: ${unit.stock}` },
                { status: 400 }
              );
            }
          } else if (units.length > 0) {
            const totalStock = units.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
            if (totalStock < orderItem.quantity) {
              return NextResponse.json(
                { error: `Insufficient stock for ${product.name}. Available: ${totalStock}` },
                { status: 400 }
              );
            }
          }
        } else {
          // Non-storage product (legacy or products without storage options)
          console.log(`Processing non-storage product`);
          if (orderItem.selectedColor) {
            // Color only: Check product variant stock
            console.log(`Checking color variant: ${orderItem.selectedColor}`);
            const colorVariant = product.variants.find(v => v.color === orderItem.selectedColor);
            if (!colorVariant) {
              console.error(`Color variant ${orderItem.selectedColor} not found for product ${product.id}`);
              console.log(`Available variants: ${product.variants.map(v => v.color).join(', ')}`);
              return NextResponse.json(
                { error: `Color ${orderItem.selectedColor} not available for product: ${product.name}` },
                { status: 400 }
              );
            }
            
            if (colorVariant.quantity < orderItem.quantity) {
              console.error(`Insufficient color variant stock for product ${product.name}. Available: ${colorVariant.quantity}, Requested: ${orderItem.quantity}`);
              return NextResponse.json(
                { error: `Insufficient stock for ${product.name} - ${orderItem.selectedColor}. Available: ${colorVariant.quantity}` },
                { status: 400 }
              );
            }
            console.log(`Color variant stock check passed: ${colorVariant.quantity} >= ${orderItem.quantity}`);
          } else {
            // No storage, no color: Check main product stock
            const mainStock = product.stock ?? 0;
            console.log(`Checking main product stock: ${mainStock} >= ${orderItem.quantity}`);
            if (mainStock < orderItem.quantity) {
              console.error(`Insufficient stock for product ${product.name} (ID: ${product.id}). Available: ${mainStock}, Requested: ${orderItem.quantity}`);
              return NextResponse.json(
                { error: `Insufficient stock for product: ${product.name}. Available: ${mainStock}` },
                { status: 400 }
              );
            }
            console.log(`Main product stock check passed`);
          }
        }
        console.log(`Stock validation completed for product ${product.name}`);
      }
      
      console.log("All products have sufficient stock");
    } catch (error) {
      console.error('Error validating products:', error instanceof Error ? error.message : String(error));
      return NextResponse.json({ error: `Failed to validate products` }, { status: 500 });
    }

    let paymentProof = null;
    
    // Only handle payment screenshot if it's a wallet payment
    if (paymentMethod === 'wallet') {
      console.log("Processing payment screenshot...");
      const paymentScreenshot = formData.get('paymentScreenshot') as File;
      if (paymentScreenshot) {
        try {
          const arrayBuffer = await paymentScreenshot.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Wrap Cloudinary in a try/catch to avoid source map errors
          try {
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: 'payment-proofs',
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });
            
            if (result && typeof result === 'object' && 'secure_url' in result) {
              paymentProof = (result as any).secure_url;
              console.log("Payment proof uploaded successfully");
            }
          } catch (cloudinaryError) {
            console.error('Cloudinary upload error:', cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError));
            // Continue without payment proof
          }
        } catch (error) {
          console.error('Error preparing payment proof:', error instanceof Error ? error.message : String(error));
          // Continue without payment proof if upload fails
        }
      }
    }

    console.log("Creating order in database...");
    let order;
    
    // Use a transaction to ensure all updates are atomic with timeout
    try {
      order = await prisma.$transaction(async (prisma) => {
        // 1. Create the order with order items
        const orderItems = items.map((item: OrderItem) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.selectedColor || null,
          storageId: item.storageId || null,
          unitId: item.unitId || null,
        }));
        
        console.log("Creating order with items count:", orderItems.length);
        
        const newOrder = await prisma.order.create({
          data: {
            userId: session.user.id,
            total: total,
            discountAmount: discountAmount || 0,
            couponId: couponData?.id || null, // Store the coupon ID
            status: 'PENDING', // Always start as PENDING, will be updated by webhook
            paymentMethod: paymentMethod === 'cash' || paymentMethod === 'cash_store_pickup' 
              ? (paymentMethod === 'cash' ? 'CASH' : 'CASH_STORE_PICKUP')
              : (paymentMethod === 'online' ? 'ONLINE' : 'ONLINE_STORE_PICKUP'),
            paymentStatus: (paymentMethod === 'cash' || paymentMethod === 'cash_store_pickup') 
              ? 'SUCCESS' 
              : 'PENDING', // COD/Store Pickup Cash = SUCCESS, Online = PENDING
            shippingName: shippingInfo.name,
            shippingPhone: shippingInfo.phone,
            shippingAddress: shippingInfo.address,
            shippingCity: shippingInfo.city,
            shippingNotes: shippingInfo.notes || null,
            paymentProof: paymentProof || null,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            fbclid: fbclid || null,
            gclid: gclid || null,
            items: {
              create: orderItems,
            },
          },
          include: {
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
        
        console.log("Order created with ID:", newOrder.id);

        // 2. Update product stock quantities, storage stock, and color variants
        console.log("Updating product stock quantities...");
        
        // Prepare all updates to execute in parallel
        const updatePromises: Promise<any>[] = [];
        
        for (const item of items) {
          console.log(`Processing item ${item.id} - Quantity: ${item.quantity}, StorageId: ${item.storageId}, Color: ${item.selectedColor}`);
          
          if (item.storageId && item.storageId !== null) {
            const product = products.find(p => p.id === item.id);
            const selectedStorage = product?.storages?.find((s: { id: string }) => s.id === item.storageId);
            const units = selectedStorage?.units ?? [];
            const unit = item.unitId
              ? units.find((u: { id: string }) => u.id === item.unitId)
              : units.find((u: { color: string }) => u.color === item.selectedColor);
            if (unit) {
              updatePromises.push(
                prisma.productStorageUnit.update({
                  where: { id: unit.id },
                  data: { stock: { decrement: item.quantity } }
                })
              );
            }
          } else {
            // Non-storage product (legacy): Update product and color variants
            if (item.selectedColor) {
              // Color only: Update product variant quantity and main product stock
              console.log(`Updating variant with color ${item.selectedColor}`);
              
              updatePromises.push(
                prisma.productVariant.updateMany({
                  where: {
                    productId: item.id,
                    color: item.selectedColor
                  },
                  data: {
                    quantity: {
                      decrement: item.quantity
                    }
                  }
                })
              );
              
              updatePromises.push(
                prisma.product.update({
                  where: { id: item.id },
                  data: {
                    stock: {
                      decrement: item.quantity
                    }
                  }
                })
              );
            } else {
              // No storage, no color: Update main product stock
              console.log(`Updating main product stock for ${item.id}`);
              updatePromises.push(
                prisma.product.update({
                  where: { id: item.id },
                  data: {
                    stock: {
                      decrement: item.quantity
                    }
                  }
                })
              );
            }
          }
        }
        
        // Execute all stock updates in parallel
        await Promise.all(updatePromises);
        
        console.log("Stock quantities updated");

        // 3. Update coupon usage count if a coupon was used
        if (couponData) {
          console.log(`Updating coupon usage for coupon ID: ${couponData.id}`);
          await prisma.coupon.update({
            where: { id: couponData.id },
            data: {
              usedCount: {
                increment: 1
              }
            }
          });
          console.log("Coupon usage count updated");
        }

        return newOrder;
      }, {
        maxWait: 10000, // 10 seconds
        timeout: 20000, // 20 seconds
      });
      
      // Clear the coupon cookie after order is created
      if (couponData) {
        const cookieStore = await cookies();
        cookieStore.delete('coupon');
        console.log("Coupon cookie cleared");
      }

      // Send confirmation email (re-enabled but with better error handling)
      if (session.user.email) {
        try {
          console.log("Sending confirmation email...");
          
          // Prepare email data without circular references
          const emailData = {
            id: order.id,
            total: Number(order.total),
            discountAmount: Number(order.discountAmount || 0),
            couponCode: couponData?.code || null,
            items: order.items.map(item => ({
              name: item.product.name || 'Product',
              quantity: item.quantity,
              price: Number(item.price),
            })),
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
          };
          
          await sendOrderConfirmationEmail(session.user.email, emailData);
          console.log("Confirmation email sent");
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError instanceof Error ? emailError.message : String(emailError));
          // Don't fail the order creation if email sending fails
        }
      }

      console.log("Order process completed successfully");
      console.log("Returning order ID:", order.id);
      return NextResponse.json({ id: order.id });
      
    } catch (error) {
      logger.error('Error creating order in database', error);
      return NextResponse.json(
        { error: publicErrorMessage('Failed to create order in database') },
        { status: 500 }
      );
    }
    
  } catch (error) {
    logger.error('Order creation error', error);
    return NextResponse.json(
      { error: publicErrorMessage('Failed to create order') },
      { status: 500 }
    );
  }
} 
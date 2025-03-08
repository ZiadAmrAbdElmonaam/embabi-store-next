import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { v2 as cloudinary } from 'cloudinary';
import { sendOrderConfirmationEmail } from '@/lib/email';

// Add these interfaces at the top of the file
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  selectedColor?: string | null;
}

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    console.log("Starting order creation process...");
    
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
    let items = [];
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
    const total = typeof totalStr === 'string' ? Number(totalStr) : null;
    console.log("Parsed total:", total);

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

    if (!total) {
      console.error('Invalid total amount');
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    console.log("All required fields validated");

    // Validate product IDs and check stock availability
    console.log("Validating products and checking stock...");
    try {
      const productIds = items.map(item => item.id);
      console.log("Product IDs to validate:", productIds);
      
      // Fetch products with their variants to check stock
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: true
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
      
      // Check stock availability for each product and color variant
      for (const orderItem of items) {
        const product = products.find(p => p.id === orderItem.id);
        if (!product) continue;
        
        // Check main product stock
        if (product.stock < orderItem.quantity) {
          console.error(`Insufficient stock for product ${product.name} (ID: ${product.id})`);
          return NextResponse.json(
            { error: `Insufficient stock for product: ${product.name}` },
            { status: 400 }
          );
        }
        
        // If color is selected, check color variant stock
        if (orderItem.selectedColor) {
          const colorVariant = product.variants.find(v => v.color === orderItem.selectedColor);
          if (!colorVariant) {
            console.error(`Color variant ${orderItem.selectedColor} not found for product ${product.id}`);
            return NextResponse.json(
              { error: `Color ${orderItem.selectedColor} not available for product: ${product.name}` },
              { status: 400 }
            );
          }
          
          if (colorVariant.quantity < orderItem.quantity) {
            console.error(`Insufficient stock for color ${orderItem.selectedColor} of product ${product.name}`);
            return NextResponse.json(
              { error: `Insufficient stock for color ${orderItem.selectedColor} of product: ${product.name}` },
              { status: 400 }
            );
          }
        }
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
              paymentProof = result.secure_url;
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
    
    // Use a transaction to ensure all updates are atomic
    try {
      order = await prisma.$transaction(async (prisma) => {
        // 1. Create the order with order items
        const orderItems = items.map((item: OrderItem) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.selectedColor || null, // Store the selected color
        }));
        
        console.log("Creating order with items count:", orderItems.length);
        
        const newOrder = await prisma.order.create({
          data: {
            userId: session.user.id,
            total,
            status: paymentMethod === 'cash' ? 'PENDING' : 'PROCESSING',
            shippingName: shippingInfo.name,
            shippingPhone: shippingInfo.phone,
            shippingAddress: shippingInfo.address,
            shippingCity: shippingInfo.city,
            shippingNotes: shippingInfo.notes || null,
            paymentProof: paymentProof || null,
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

        // 2. Update product stock quantities and color variants
        console.log("Updating product stock quantities...");
        
        for (const item of items) {
          console.log(`Processing item ${item.id} - Quantity: ${item.quantity}`);
          
          // Always update the main product stock
          console.log(`Updating main product stock for ${item.id}`);
          await prisma.product.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
          console.log(`Main product stock updated`);
          
          // If a color is selected, update that specific variant's quantity
          if (item.selectedColor) {
            console.log(`Updating variant with color ${item.selectedColor}`);
            
            // Find and update the variant with matching color
            const variant = await prisma.productVariant.findFirst({
              where: {
                productId: item.id,
                color: item.selectedColor
              }
            });

            if (variant) {
              console.log(`Found variant, updating quantity`);
              await prisma.productVariant.update({
                where: { id: variant.id },
                data: {
                  quantity: {
                    decrement: item.quantity
                  }
                }
              });
              console.log(`Variant quantity updated`);
            } else {
              console.log(`No variant found for color ${item.selectedColor}`);
            }
          }
        }
        
        console.log("Stock quantities updated");
        return newOrder;
      });
      
      // Send confirmation email (re-enabled but with better error handling)
      if (session.user.email) {
        try {
          console.log("Sending confirmation email...");
          
          // Prepare email data without circular references
          const emailData = {
            id: order.id,
            total: Number(order.total),
            items: order.items.map(item => ({
              name: item.product.name || 'Product',
              quantity: item.quantity,
              price: Number(item.price),
            })),
            shippingName: order.shippingName,
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
      console.error('Error creating order in database:', error instanceof Error ? error.message : String(error));
      return NextResponse.json({ error: `Failed to create order in database` }, { status: 500 });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Order creation error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 
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
    const session = await getServerSession(authOptions);
    console.log("Session:", session); // Log the session information

    if (!session || !session.user.id) {
      console.log("Unauthorized access attempt"); // Log unauthorized access
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    console.log("Received FormData fields:", Array.from(formData.keys())); // Log received fields

    const items = JSON.parse(formData.get('items') as string) as OrderItem[];
    console.log("Parsed items:", items); // Log parsed items

    const paymentMethod = formData.get('paymentMethod');
    console.log("Payment method:", paymentMethod); // Log payment method

    const shippingInfo = JSON.parse(formData.get('shippingInfo') as string) as ShippingInfo;
    console.log("Shipping info:", shippingInfo); // Log shipping info

    const total = Number(formData.get('total'));
    console.log("Total:", total); // Log total

    // Validate required fields
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

    // Validate product IDs
    try {
      const productIds = items.map(item => item.id);
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });

      const existingProductIds = new Set(existingProducts.map(product => product.id));
      const invalidProductIds = productIds.filter(id => !existingProductIds.has(id));

      if (invalidProductIds.length > 0) {
        console.error('Invalid product IDs:', invalidProductIds);
        return NextResponse.json(
          { error: 'Some products in the order do not exist' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error validating products:', error);
      throw error;
    }

    let paymentProof = null;
    
    // Only handle payment screenshot if it's a wallet payment
    if (paymentMethod === 'wallet') {
      const paymentScreenshot = formData.get('paymentScreenshot') as File;
      if (paymentScreenshot) {
        try {
          const arrayBuffer = await paymentScreenshot.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
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
          paymentProof = (result as unknown as { secure_url: string })?.secure_url || null;
        } catch (error) {
          console.error('Error uploading payment proof:', error);
          throw error;
        }
      }
    }

    // Create the order with flattened shipping info
    try {
      const order = await prisma.order.create({
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
            create: items.map((item: OrderItem) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
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

      // Send confirmation email
      if (session.user.email) {
        try {
          await sendOrderConfirmationEmail(session.user.email, {
            id: order.id,
            total: Number(order.total),
            items: order.items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: Number(item.price),
            })),
            shippingName: order.shippingName,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
          });
        } catch (error) {
          console.error('Error sending confirmation email:', error);
          // Don't throw here, as the order was created successfully
        }
      }

      return NextResponse.json({ id: order.id });
    } catch (error) {
      console.error('Error creating order in database:', error);
      throw error;
    }
  } catch (error) {
    console.error('Order creation error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 
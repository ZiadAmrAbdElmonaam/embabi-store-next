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
    const items = JSON.parse(formData.get('items') as string) as OrderItem[];
    const paymentMethod = formData.get('paymentMethod');
    const shippingInfo = JSON.parse(formData.get('shippingInfo') as string) as ShippingInfo;
    const total = Number(formData.get('total'));
    
    // Validate product IDs
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

    let paymentProof: string | null = null;
    
    // Only handle payment screenshot if it's a wallet payment
    if (paymentMethod === 'wallet') {
      const paymentScreenshot = formData.get('paymentScreenshot') as File;
      if (paymentScreenshot) {
        // Upload to Cloudinary
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
      }
    }

    // Create the order with flattened shipping info
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
      // Include necessary relations for email
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
    }

    return NextResponse.json({ id: order.id });
  } catch (error) {
    console.error('Order creation error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 
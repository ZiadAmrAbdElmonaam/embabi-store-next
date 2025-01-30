import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const items = JSON.parse(formData.get('items') as string) as OrderItem[];
    const paymentMethod = formData.get('paymentMethod');
    const shippingInfo = JSON.parse(formData.get('shippingInfo') as string) as ShippingInfo;
    const total = Number(formData.get('total'));
    
    let paymentProof = null;
    
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
            
        paymentProof = (result as unknown as { secure_url: string }).secure_url;
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
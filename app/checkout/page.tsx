import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CheckoutForm from "@/components/checkout/checkout-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user's cart and user data
  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: 'PENDING'
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order || order.items.length === 0) {
    redirect("/cart");
  }

  // Get user data separately to ensure we have the latest information
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      name: true,
      email: true
    }
  });

  if (!user) {
    redirect("/auth/signin");
  }

  // Format cart items to handle Decimal serialization
  const formattedItems = order.items.map(item => ({
    id: item.productId,
    name: item.product.name,
    price: Number(item.price),
    salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
    images: item.product.images,
    quantity: item.quantity
  }));

  const subtotal = formattedItems.reduce((total, item) => 
    total + ((item.salePrice || item.price) * item.quantity), 0
  );
  const shipping = subtotal > 10000 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/cart" 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Checkout</h1>
            </div>
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Continue Shopping
            </Link>
          </div>

          <CheckoutForm 
            user={user}
            items={formattedItems}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
          />
        </div>
      </div>
    </div>
  );
} 
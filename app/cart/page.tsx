import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import CartItems from "@/components/cart/cart-items";

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: 'PENDING'
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: true
            }
          }
        }
      }
    }
  });

  // Format cart items to handle Decimal serialization
  const formattedItems = order?.items.map(item => ({
    id: item.productId,
    name: item.product.name,
    price: Number(item.price),
    salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
    images: item.product.images,
    quantity: item.quantity,
    stock: item.product.stock,
    variants: item.product.variants.map(variant => ({
      ...variant,
      price: Number(variant.price)
    })),
    selectedColor: null // This will be managed in the client component
  })) || [];

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
          </div>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {formattedItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Start adding items to your cart!</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <CartItems initialItems={formattedItems} />
        )}
      </div>
    </div>
  );
} 
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ReviewForm } from "@/components/reviews/review-form";
import { Star, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/products/product-details";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Convert Decimal to number before passing to client components
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    reviews: product.reviews.map(review => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  // Check if user has purchased this product
  const hasPurchased = session?.user ? await prisma.orderItem.findFirst({
    where: {
      productId: product.id,
      order: {
        userId: session.user.id,
        status: 'DELIVERED',
      },
    },
  }) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetails 
        product={serializedProduct} 
        session={session} 
        hasPurchased={!!hasPurchased}
      />
    </div>
  );
} 
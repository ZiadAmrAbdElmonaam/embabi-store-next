import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/products/product-details";
import { authOptions } from "@/app/api/auth/auth-options";

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
      variants: true,
      details: true,
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
    variants: product.variants.map(variant => ({
      id: variant.id,
      color: variant.color,
      quantity: variant.quantity,
    })),
    details: product.details.map(detail => ({
      id: detail.id,
      label: detail.label,
      description: detail.description,
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
        product={{
          ...serializedProduct,
          reviews: serializedProduct.reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment || '', // Convert null to empty string
            createdAt: review.createdAt,
            user: {
              name: review.user.name || '' // Convert null to empty string
            }
          }))
        }}
        session={session} 
        hasPurchased={!!hasPurchased}
      />
    </div>
  );
} 
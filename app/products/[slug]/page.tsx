import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/products/product-details";
import { authOptions } from "@/app/api/auth/auth-options";

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // In Next.js 13+, params should be directly used without checking async properties
  if (!params || typeof params.slug !== 'string') {
    notFound();
  }

  const slug = params.slug;
  const session = await getServerSession(authOptions);
  
  const product = await prisma.product.findUnique({
    where: { slug },
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

  // Add console log to debug the product data
  console.log("Product thumbnails from DB:", product?.thumbnails);

  if (!product) {
    notFound();
  }

  // Convert Decimal to number before passing to client components
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    // Ensure images is an array
    images: Array.isArray(product.images) ? product.images : [],
    // Ensure thumbnails is an array
    thumbnails: Array.isArray(product.thumbnails) ? product.thumbnails : [],
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
    <div className="container mx-auto px-4 py-8 bg-white">
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
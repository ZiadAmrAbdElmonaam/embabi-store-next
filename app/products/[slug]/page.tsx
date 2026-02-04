import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/products/product-details";
import { ProductStructuredData } from "@/components/seo/structured-data";
import { authOptions } from "@/app/api/auth/auth-options";
import { Metadata } from "next";
import { getProductDisplayPrice } from "@/lib/utils";

// Add revalidation - cache for 5 minutes (product details change occasionally)
export const revalidate = 300;

interface ProductPageProps {
  params: { slug: string };
}

// Generate dynamic metadata for the product page
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const slug = params.slug;
  
  // Fetch the product
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  // Return default metadata if product not found
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  // Calculate the average rating if reviews exist
  const averageRating = await prisma.review.aggregate({
    where: { 
      productId: product.id 
    },
    _avg: {
      rating: true
    },
    _count: true
  });

  const ratingText = averageRating._avg.rating 
    ? `${averageRating._avg.rating.toFixed(1)}/5 (${averageRating._count} reviews)` 
    : '';
  
  // Format price
  const formattedPrice = product.salePrice 
    ? `EGP ${product.salePrice}` 
    : `EGP ${Number(product.price).toFixed(2)}`;
  
  const discountText = product.salePrice 
    ? ` (${Math.round(((Number(product.price) - product.salePrice) / Number(product.price)) * 100)}% off)` 
    : '';

  // Create a clean description without HTML
  const cleanDescription = product.description
    .replace(/<[^>]*>?/gm, '')
    .slice(0, 160);

  // Generate SEO friendly metadata
  return {
    title: product.name,
    description: `${cleanDescription} ${ratingText ? `| ${ratingText}` : ''} | ${formattedPrice}${discountText} | Shop at Embabi Store.`,
    keywords: `${product.name}, ${product.category.name}, buy online, Embabi Store, Egypt`,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: product.name,
      description: cleanDescription,
      url: `/products/${slug}`,
      type: 'website',
      images: product.images.map(image => ({
        url: image,
        width: 800,
        height: 600,
        alt: product.name,
      })),
    },
  };
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
      storages: {
        include: {
          units: true,
        },
      },
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

  // Compute availability: SIMPLE uses main stock, STORAGE uses sum of units
  const hasStock = product.productType === 'SIMPLE'
    ? (product.stock ?? 0) > 0
    : product.storages?.some(s => s.units?.some(u => u.stock > 0)) ?? false;

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
    storages: product.storages.map(storage => ({
      id: storage.id,
      size: storage.size,
      price: Number(storage.price),
      salePercentage: storage.salePercentage,
      saleEndDate: storage.saleEndDate?.toISOString() || null,
      units: storage.units.map(unit => ({
        id: unit.id,
        color: unit.color,
        stock: unit.stock,
        taxStatus: unit.taxStatus,
        taxType: unit.taxType,
        taxAmount: unit.taxAmount != null ? Number(unit.taxAmount) : null,
        taxPercentage: unit.taxPercentage != null ? Number(unit.taxPercentage) : null,
      })),
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

  // Format reviews for structured data
  const structuredReviews = serializedProduct.reviews.map(review => ({
    author: review.user?.name || 'Anonymous',
    rating: review.rating,
    content: review.comment || '',
  }));

  // Fetch You May Also Like (same category + parent category if exists, exclude current product)
  const categoryWithParent = await prisma.category.findUnique({
    where: { id: product.categoryId },
    include: { parent: true },
  });

  const youMayAlsoLikeCategoryIds = [product.categoryId];
  if (categoryWithParent?.parentId) {
    youMayAlsoLikeCategoryIds.push(categoryWithParent.parentId);
  }

  const youMayAlsoLikeProducts = await prisma.product.findMany({
    where: {
      categoryId: { in: youMayAlsoLikeCategoryIds },
      id: { not: product.id },
      OR: [
        { stock: { gt: 0 } },
        {
          storages: {
            some: {
              units: {
                some: {
                  stock: { gt: 0 }
                }
              }
            }
          }
        }
      ]
    },
    take: 12,
    include: {
      category: true,
      variants: true,
      storages: {
        include: {
          units: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Format "You May Also Like" products for ProductCard
  const formattedYouMayAlsoLike = youMayAlsoLikeProducts.map(p => {
    const displayPrice = getProductDisplayPrice({
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      sale: p.sale ?? null,
      saleEndDate: p.saleEndDate ? p.saleEndDate.toISOString() : null,
      storages: p.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
        units: storage.units?.map(u => ({
          id: u.id,
          color: u.color,
          stock: u.stock,
          taxStatus: u.taxStatus,
          taxType: u.taxType,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })) ?? [],
      })) || []
    });

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      taxStatus: displayPrice.taxStatus ?? null,
      sale: p.sale,
      stock: p.stock ?? 0,
      images: p.images,
      slug: p.slug,
      variants: p.variants.map(v => ({
        id: v.id,
        color: v.color,
        quantity: v.quantity
      })),
      storages: p.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
        units: storage.units.map(u => ({
          id: u.id,
          color: u.color,
          stock: u.stock,
          taxStatus: u.taxStatus,
          taxType: u.taxType,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })),
      })) || [],
    };
  });

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900">
      <ProductStructuredData
        name={serializedProduct.name}
        description={serializedProduct.description}
        images={serializedProduct.images}
        price={serializedProduct.salePrice || serializedProduct.price}
        sku={serializedProduct.id}
        brand={serializedProduct.category?.name || 'Embabi Store'}
        availability={hasStock ? 'InStock' : 'OutOfStock'}
        reviews={structuredReviews}
      />
      
      <ProductDetails 
        product={{
          ...serializedProduct,
          reviews: serializedProduct.reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment || '', // Convert null to empty string
            createdAt: review.createdAt,
            user: {
              name: review.user?.name || 'Anonymous' // Convert null to Anonymous
            }
          }))
        }}
        session={session} 
        hasPurchased={!!hasPurchased}
        youMayAlsoLike={formattedYouMayAlsoLike}
      />
    </div>
  );
} 
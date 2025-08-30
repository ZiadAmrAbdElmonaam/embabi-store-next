import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { getProductDisplayPrice } from "@/lib/utils";
import { ProductsClient } from "@/components/products/products-client";

// Add revalidation - cache for 3 minutes
export const revalidate = 180;

interface SearchParams {
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Await searchParams to fix Next.js warning
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams?.page;
  
  // Simple pagination only
  const ITEMS_PER_PAGE = 12;
  const currentPage = pageParam ? parseInt(pageParam as string, 10) : 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  // Get total products count
  const totalProducts = await prisma.product.count();
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Get all products with simple pagination
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
      reviews: {
        select: {
          rating: true,
        },
      },
      storages: {
        include: {
          variants: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' // Default sort by newest
    },
    skip,
    take: ITEMS_PER_PAGE,
  });

  const categories = await prisma.category.findMany();
  const maxProductPrice = await prisma.product.aggregate({
    _max: { price: true },
  });

  // Convert Decimal to number before passing to client components
  const serializedProducts = products.map(product => {
    // Get display pricing (prioritizes storage with stock)
    const displayPrice = getProductDisplayPrice({
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      storages: product.storages.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        stock: storage.stock,
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
      }))
    });

    return {
      ...product,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      storages: product.storages.map(storage => ({
        ...storage,
        price: Number(storage.price),
        createdAt: storage.createdAt.toISOString(),
        updatedAt: storage.updatedAt.toISOString(),
      }))
    };
  });

  // Create a simplified searchParams object with just the page info for the client
  const clientSearchParams = { page: pageParam };

  return (
    <ProductsClient 
      initialProducts={serializedProducts}
      categories={categories}
      maxPrice={Number(maxProductPrice._max.price) || 0}
      isAdmin={isAdmin}
      searchParams={clientSearchParams}
      totalPages={totalPages}
    />
  );
} 
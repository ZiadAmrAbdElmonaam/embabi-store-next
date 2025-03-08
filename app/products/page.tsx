import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { ProductsClient } from "@/components/products/products-client";

interface SearchParams {
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Parse searchParams safely by extracting the page parameter early
  const pageParam = searchParams?.page;
  
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
  const serializedProducts = products.map(product => ({
    ...product,
    price: Number(product.price),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  }));

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
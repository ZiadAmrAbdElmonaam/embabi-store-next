import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { ProductsClient } from "@/components/products/products-client";

interface SearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  q?: string;
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ITEMS_PER_PAGE = 12;
  const currentPage = Number(searchParams.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const totalProducts = await prisma.product.count({
    where: {
      AND: [
        // Category filter
        searchParams.category ? { categoryId: searchParams.category } : {},
        // Price range filter
        {
          price: {
            gte: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
            lte: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
          },
        },
        // Search query
        searchParams.q
          ? {
              OR: [
                { name: { contains: searchParams.q, mode: 'insensitive' } },
                { description: { contains: searchParams.q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    },
  });

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const products = await prisma.product.findMany({
    where: {
      AND: [
        // Category filter
        searchParams.category ? { categoryId: searchParams.category } : {},
        // Price range filter
        {
          price: {
            gte: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
            lte: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
          },
        },
        // Search query
        searchParams.q
          ? {
              OR: [
                { name: { contains: searchParams.q, mode: 'insensitive' } },
                { description: { contains: searchParams.q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    },
    include: {
      category: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      ...(searchParams.sort === 'price_asc' && { price: 'asc' }),
      ...(searchParams.sort === 'price_desc' && { price: 'desc' }),
      ...(searchParams.sort === 'newest' && { createdAt: 'desc' }),
      ...(searchParams.sort === 'popular' && { reviews: { _count: 'desc' } }),
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

  return (
    <ProductsClient 
      initialProducts={serializedProducts}
      categories={categories}
      maxPrice={Number(maxProductPrice._max.price) || 0}
      isAdmin={isAdmin}
      searchParams={searchParams}
      totalPages={totalPages}
    />
  );
} 
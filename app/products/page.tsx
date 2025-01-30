import { prisma } from "@/lib/prisma";
import { ProductFilters } from "@/components/products/product-filters";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SearchBar } from "@/components/ui/search-bar";
import { PriceRange } from "@/components/ui/price-range";
import { ProductSort } from "@/components/products/product-sort";
import { ProductGrid, ProductWithDetails } from "@/components/products/product-grid";

interface SearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  q?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const { category, minPrice, maxPrice, sort, q } = searchParams;

  const products = await prisma.product.findMany({
    where: {
      AND: [
        // Category filter
        category ? { categoryId: category } : {},
        // Price range filter
        {
          price: {
            gte: minPrice ? parseFloat(minPrice) : undefined,
            lte: maxPrice ? parseFloat(maxPrice) : undefined,
          },
        },
        // Search query
        q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
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
      ...(sort === 'price_asc' && { price: 'asc' }),
      ...(sort === 'price_desc' && { price: 'desc' }),
      ...(sort === 'newest' && { createdAt: 'desc' }),
      ...(sort === 'popular' && { reviews: { _count: 'desc' } }),
    },
  });

  // Convert Decimal to number before passing to client components
  const serializedProducts: ProductWithDetails[] = products.map(product => ({
    ...product,
    price: Number(product.price),
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt)
  }));

  const categories = await prisma.category.findMany();
  const maxProductPrice = await prisma.product.aggregate({
    _max: { price: true },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-6">
          <ProductFilters
            categories={categories}
            maxPrice={maxProductPrice._max.price ? Number(maxProductPrice._max.price) : 0}
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Products</h1>
            <ProductSort />
          </div>

          <ProductGrid products={serializedProducts} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SearchBar />
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <PriceRange />
          </div>
          {isAdmin && (
            <Link
              href="/products/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Product
            </Link>
          )}
        </div>
      </div>

      {products.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
} 
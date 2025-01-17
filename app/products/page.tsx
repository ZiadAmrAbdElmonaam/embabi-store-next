import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import { ProductFilters } from "@/components/ui/product-filters";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  // Get all categories for the filter
  const categories = await prisma.category.findMany();

  // Build the query
  const where = searchParams.category
    ? {
        category: {
          slug: searchParams.category,
        },
      }
    : {};

  // Handle sorting
  const orderBy = searchParams.sort === "price_desc"
    ? { price: "desc" }
    : searchParams.sort === "price_asc"
    ? { price: "asc" }
    : { createdAt: "desc" };

  // Get products
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy,
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Products</h1>
        <ProductFilters categories={categories} />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
} 
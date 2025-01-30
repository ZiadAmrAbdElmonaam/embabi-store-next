import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  // Convert Decimal to number for serialization
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        include: {
          category: true
        }
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Convert Decimal prices to numbers
  const products = category.products.map(product => ({
    ...product,
    price: Number(product.price),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-gray-600 mb-8">{category.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No products in this category yet.
        </p>
      )}
    </div>
  );
} 
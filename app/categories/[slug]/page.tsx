import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import { notFound } from "next/navigation";

export default async function CategoryPage({
  params
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: true,
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-gray-600 mb-8">{category.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {category.products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={{
              ...product,
              category,
            }}
          />
        ))}
      </div>

      {category.products.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No products in this category yet.
        </p>
      )}
    </div>
  );
} 
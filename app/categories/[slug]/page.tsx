import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
        <p className="text-gray-600 mb-8">
          The category you're looking for doesn't exist.
        </p>
        <Link 
          href="/categories" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Browse all categories
        </Link>
      </div>
    );
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

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-gray-500 mb-4">
            No products in {category.name} category yet.
          </p>
          <Link 
            href="/products" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
} 
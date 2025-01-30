import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from 'next/image';

export default async function Home() {
  const featuredProducts = await prisma.product.findMany({
    take: 4,
    include: {
      category: true,
    },
  });

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gray-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to Tech Store</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your one-stop shop for all things tech
        </p>
        <Link
          href="/products"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
        >
          Shop Now
        </Link>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {product.images[0] && (
                <div className="aspect-square relative">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {product.category.name}
                </p>
                <p className="text-lg font-bold">
                  ${Number(product.price).toFixed(2)}
                </p>
                <Link
                  href={`/products/${product.slug}`}
                  className="mt-2 block text-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/categories/phones"
            className="bg-gray-100 p-6 rounded-lg text-center hover:bg-gray-200"
          >
            <h3 className="font-semibold">Phones</h3>
          </Link>
          <Link
            href="/categories/laptops"
            className="bg-gray-100 p-6 rounded-lg text-center hover:bg-gray-200"
          >
            <h3 className="font-semibold">Laptops</h3>
          </Link>
          <Link
            href="/categories/tablets"
            className="bg-gray-100 p-6 rounded-lg text-center hover:bg-gray-200"
          >
            <h3 className="font-semibold">Tablets</h3>
          </Link>
          <Link
            href="/categories/accessories"
            className="bg-gray-100 p-6 rounded-lg text-center hover:bg-gray-200"
          >
            <h3 className="font-semibold">Accessories</h3>
          </Link>
        </div>
      </section>
    </div>
  );
}

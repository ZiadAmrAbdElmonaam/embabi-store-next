import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Carousel } from "@/components/ui/carousel";
import { ProductCard } from "@/components/products/product-card";


export default async function HomePage() {
  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    take: 6,
    include: {
      category: true,
      variants: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Convert Decimal prices to numbers and format the data
  const formattedProducts = featuredProducts.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
    images: product.images,
    slug: product.slug,
    colors: product.variants.map(variant => variant.color)
  }));

  // Fetch categories
  const categories = await prisma.category.findMany({
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      image: true
    }
  });

  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <Carousel />

      {/* Categories Section */}
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition"
              >
                <div className="aspect-square relative">
                  {category.image && (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 group-hover:opacity-0" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-4xl font-bold text-white text-center px-4 py-2 transition-opacity duration-300 group-hover:opacity-0">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-4">
        <div className="max-w-[1800px] mx-auto px-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Featured Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {formattedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-red-700 transition"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Genuine Products</h3>
              <p className="text-gray-600">All our products are authentic and come with warranty</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping to your doorstep</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Multiple secure payment options available</p>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}

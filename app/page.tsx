import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { HomeCarousel } from "@/components/home/carousel";
import { CategoriesCarousel } from "@/components/home/categories-carousel";
import { MainCategoriesCarousel } from "@/components/home/main-categories-carousel";
import { BrandsCarousel } from "@/components/home/brands-carousel";
import { ProductCard } from "@/components/products/product-card";
import { TranslatedContent } from "@/components/ui/translated-content";
import { getProductDisplayPrice } from "@/lib/utils";
import { groupCategoriesByBrand } from "@/lib/brand-utils";

// Add revalidation - cache for 5 minutes
export const revalidate = 300;

export default async function HomePage() {
  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      OR: [
        // Products with main stock
        {
          stock: {
            gt: 0
          }
        },
        // Products with storage that has stock
        {
          storages: {
            some: {
              stock: {
                gt: 0
              }
            }
          }
        }
      ]
    },
    take: 10,
    include: {
      category: true,
      variants: true,
      storages: {
        include: {
          variants: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Convert Decimal prices to numbers and format the data
  const formattedProducts = featuredProducts.map(product => {
    // Get display pricing (prioritizes storage with stock)
    const displayPrice = getProductDisplayPrice({
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      storages: product.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        stock: storage.stock,
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
      })) || []
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      sale: product.sale,
      stock: product.stock,
      images: product.images,
      slug: product.slug,
      category: product.category,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      variants: product.variants.map(variant => ({
        id: variant.id,
        color: variant.color,
        quantity: variant.quantity
      })),
      storages: product.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        stock: storage.stock,
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
        variants: storage.variants.map(variant => ({
        id: variant.id,
        color: variant.color,
        quantity: variant.quantity
      }))
      })) || []
    };
  });

  // Fetch main categories for the new section
  const mainCategories = await prisma.category.findMany({
    where: {
      parentId: null, // Only parent categories
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      children: {
        select: { id: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Format main categories
  const formattedMainCategories = mainCategories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image,
    subcategoryCount: category.children.length
  }));

  // Fetch all categories for brand grouping
  const allCategories = await prisma.category.findMany({
    include: {
      parent: {
        select: { id: true, name: true, slug: true }
      },
      _count: {
        select: { products: true }
      }
    },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
  });

  // Fetch subcategories with products for "Shop by Category" section  
  const subcategories = await prisma.category.findMany({
    where: {
      parentId: { not: null }, // Only child categories
      products: {
        some: {
          OR: [
            { stock: { gt: 0 } },
            { storages: { some: { stock: { gt: 0 } } } }
          ]
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      products: {
        where: {
          OR: [
            { stock: { gt: 0 } },
            { storages: { some: { stock: { gt: 0 } } } }
          ]
        },
        select: { id: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Format subcategories for "Shop by Category"
  const formattedSubcategories = subcategories
    .map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      productCount: category.products.length
    }))
    .filter(category => category.productCount > 0); // Only show categories with products

  // Group categories by brand for "Shop by Brands" section
  const brandGroups = groupCategoriesByBrand(allCategories);

  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <div className="w-full max-w-[1440px] mx-auto px-0 sm:px-2 md:px-4 py-0 sm:py-2 md:py-4">
        <HomeCarousel />
      </div>

      {/* Categories Section */}
      <section className="py-4 sm:py-6 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            <TranslatedContent translationKey="home.categories" />
          </h2>
          <MainCategoriesCarousel categories={formattedMainCategories} />
        </div>
      </section>
      {/* Brands Section - Commented out temporarily */}
      {/* <section className="py-4 sm:py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            <TranslatedContent translationKey="home.brands" />
          </h2>
          {brandGroups.length > 0 ? (
            <BrandsCarousel brands={brandGroups} />
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-500 text-base sm:text-lg">
                <TranslatedContent translationKey="home.noBrands" />
              </p>
              <p className="text-gray-400 text-sm mt-2">
                <TranslatedContent translationKey="home.addBrandedCategories" />
              </p>
            </div>
          )}
        </div>
      </section> */}

      {/* Featured Products Section */}
      <section className="py-4">
        <div className="max-w-[1800px] mx-auto px-2 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            <TranslatedContent translationKey="home.featuredProducts" />
          </h2>
          {formattedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {formattedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              <TranslatedContent translationKey="home.noProducts" />
            </p>
          )}
          <div className="text-center mt-6">
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-red-700 transition"
            >
              <TranslatedContent translationKey="home.viewAllProducts" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                <TranslatedContent translationKey="home.features.genuineProducts.title" />
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedContent translationKey="home.features.genuineProducts.description" />
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                <TranslatedContent translationKey="home.features.fastDelivery.title" />
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedContent translationKey="home.features.fastDelivery.description" />
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                <TranslatedContent translationKey="home.features.securePayment.title" />
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                <TranslatedContent translationKey="home.features.securePayment.description" />
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { HomeCarousel } from "@/components/home/carousel";
import { CouponBanner } from "@/components/home/coupon-banner";
import { CategoriesCarousel } from "@/components/home/categories-carousel";
import { MainCategoriesCarousel } from "@/components/home/main-categories-carousel";
import { ProductsHorizontalScroll } from "@/components/home/products-horizontal-scroll";
import { ProductCard } from "@/components/products/product-card";
import { BrandsCarousel } from "@/components/home/brands-carousel";
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
        // Products with storage that has units with stock
        {
          storages: {
            some: {
              units: {
                some: {
                  stock: {
                    gt: 0
                  }
                }
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
          units: true,
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
      sale: product.sale ?? null,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      storages: product.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
        units: (storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> }).units?.map(u => ({
          id: u.id,
          color: u.color,
          stock: u.stock,
          taxStatus: u.taxStatus,
          taxType: u.taxType,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })) ?? [],
      })) || []
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      taxStatus: displayPrice.taxStatus ?? null,
      sale: product.sale,
      stock: product.stock ?? 0,
      images: product.images,
      slug: product.slug,
      category: product.category,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      variants: product.variants.map(variant => ({
        id: variant.id,
        color: variant.color,
        quantity: variant.quantity
      })),
      storages: product.storages?.map(storage => {
        const s = storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> };
        return {
          id: storage.id,
          size: storage.size,
          price: Number(storage.price),
          salePercentage: storage.salePercentage,
          saleEndDate: storage.saleEndDate?.toISOString() || null,
          units: s.units?.map(u => ({
            id: u.id,
            color: u.color,
            stock: u.stock,
            taxStatus: u.taxStatus,
            taxType: u.taxType,
            taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
            taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
          })) ?? [],
        };
      }) || []
    };
  });

  // Stock filter for products
  const stockFilter = {
    OR: [
      { stock: { gt: 0 } },
      { storages: { some: { units: { some: { stock: { gt: 0 } } } } } }
    ]
  } as const;

  // New Arrival: 8 products, sorted by newest
  const newArrivalProducts = await prisma.product.findMany({
    where: stockFilter,
    take: 8,
    include: {
      category: true,
      variants: true,
      storages: { include: { units: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Parent categories with products (direct or in subcategories)
  const parentCategoriesWithProducts = await prisma.category.findMany({
    where: {
      parentId: null,
      OR: [
        { products: { some: stockFilter } },
        { children: { some: { products: { some: stockFilter } } } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      products: {
        where: stockFilter,
        select: { id: true }
      },
      children: {
        select: {
          products: {
            where: stockFilter,
            select: { id: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Filter to parents with >= 4 products total (direct + from children)
  const parentCategoriesFiltered = parentCategoriesWithProducts.filter(parent => {
    const directCount = parent.products.length;
    const fromChildren = parent.children.reduce((sum, c) => sum + c.products.length, 0);
    return directCount + fromChildren >= 4;
  });

  // Fetch 8 products per parent, sorted by most selling then new arrival
  const parentCategorySections = await Promise.all(
    parentCategoriesFiltered.map(async (parent) => {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { categoryId: parent.id },
                { category: { parentId: parent.id } }
              ]
            },
            stockFilter
          ]
        },
        take: 8,
        include: {
          category: true,
          variants: true,
          storages: { include: { units: true } },
        },
        orderBy: [
          { orderItems: { _count: 'desc' } },
          { createdAt: 'desc' }
        ]
      });
      return { category: parent, products };
    })
  );

  // Helper to format product for display
  const formatProductForDisplay = (product: {
    id: string;
    name: string;
    description: string;
    price: number | null;
    salePrice: number | null;
    sale: number | null;
    saleEndDate: Date | null;
    stock: number | null;
    images: string[];
    slug: string;
    category: { id: string; name: string; slug: string };
    variants: Array<{ id: string; color: string; quantity: number }>;
    storages: Array<{
      id: string;
      size: string;
      price: { toNumber: () => number };
      salePercentage: number | null;
      saleEndDate: Date | null;
      units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }>;
    }>;
  }) => {
    const displayPrice = getProductDisplayPrice({
      price: Number(product.price ?? 0),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      sale: product.sale ?? null,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      storages: product.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
        units: (storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> }).units?.map((u) => ({
          id: u.id,
          color: u.color,
          stock: u.stock,
          taxStatus: u.taxStatus,
          taxType: u.taxType,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })) ?? [],
      })) || []
    });
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      taxStatus: displayPrice.taxStatus ?? null,
      sale: product.sale,
      stock: product.stock ?? 0,
      images: product.images,
      slug: product.slug,
      category: product.category,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      variants: product.variants.map(v => ({ id: v.id, color: v.color, quantity: v.quantity })),
      storages: product.storages.map(storage => {
        const s = storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> };
        return {
          id: storage.id,
          size: storage.size,
          price: Number(storage.price),
          salePercentage: storage.salePercentage,
          saleEndDate: storage.saleEndDate?.toISOString() || null,
          units: s.units?.map((u) => ({
            id: u.id,
            color: u.color,
            stock: u.stock,
            taxStatus: u.taxStatus,
            taxType: u.taxType,
            taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
            taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
          })) ?? [],
        };
      })
    };
  };

  const formattedNewArrival = newArrivalProducts.map(formatProductForDisplay);
  const formattedParentSections = parentCategorySections.map(({ category, products }) => ({
    category: { id: category.id, name: category.name, slug: category.slug },
    products: products.map(formatProductForDisplay)
  }));

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
            { storages: { some: { units: { some: { stock: { gt: 0 } } } } } }
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
            { storages: { some: { units: { some: { stock: { gt: 0 } } } } } }
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
      {/* Coupon Promotion Banner - Before Carousel */}
      <div className="w-full pt-2 sm:pt-3 md:pt-4 px-2 sm:px-4">
        <CouponBanner />
      </div>
      {/* Hero Carousel Section */}
      <div className="w-full max-w-[1440px] mx-auto px-0 sm:px-2 md:px-4 py-0 sm:py-2 md:py-4">
        <HomeCarousel />
      </div>

      {/* Categories Section - Distinct background for contrast */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-900/60 dark:to-slate-800/50 border-y border-slate-200/60 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <TranslatedContent translationKey="home.categories" />
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
              <TranslatedContent translationKey="home.categoriesSubtitle" />
            </p>
          </div>
          <MainCategoriesCarousel categories={formattedMainCategories} />
        </div>
      </section>

      {/* Featured Products Section - Grid */}
      <section className="py-8 sm:py-10 bg-white dark:bg-gray-900">
        <div className="max-w-[1800px] mx-auto px-2">
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

      {/* New Arrival Section - Horizontal Scroll */}
      {formattedNewArrival.length > 0 && (
        <section className="py-8 sm:py-10 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-[1800px] mx-auto px-2">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                <TranslatedContent translationKey="home.newArrival" />
              </h2>
              <Link
                href="/products"
                className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium"
              >
                <TranslatedContent translationKey="home.viewAllProducts" />
              </Link>
            </div>
            <div className="flex justify-center w-full">
              <ProductsHorizontalScroll products={formattedNewArrival} maxVisible={6} />
            </div>
          </div>
        </section>
      )}

      {/* Parent Category Product Sections - Horizontal Scroll (alternating backgrounds) */}
      {formattedParentSections.map(({ category, products }, idx) => (
        <section
          key={category.id}
          className={`py-8 sm:py-10 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}
        >
          <div className="max-w-[1800px] mx-auto px-2">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {category.name}
              </h2>
              <Link
                href={`/categories/${category.slug}`}
                className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium"
              >
                <TranslatedContent translationKey="home.viewAllProducts" />
              </Link>
            </div>
            <div className="flex justify-center w-full">
              <ProductsHorizontalScroll products={products} maxVisible={6} />
            </div>
          </div>
        </section>
      ))}

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

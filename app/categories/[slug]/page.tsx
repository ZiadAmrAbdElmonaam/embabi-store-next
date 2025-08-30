import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import Link from "next/link";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import { getProductDisplayPrice } from "@/lib/utils";

// Add revalidation - cache for 5 minutes (category pages change when products are added/removed)
export const revalidate = 300;

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  // Get language from cookies for server component
  const cookieStore = cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as 'en' | 'ar';
  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  // Convert Decimal to number for serialization
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          _count: {
            select: { products: true }
          }
        },
        where: {
          products: { some: {} } // Only children with products
        }
      },
      products: {
        include: {
          category: true,
          variants: true,
          storages: {
            include: {
              variants: true,
            },
          },
        }
      },
    },
  });

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">{t('categoryDetail.categoryNotFound')}</h1>
        <p className="text-gray-600 mb-8">
          {t('categoryDetail.categoryNotExist')}
        </p>
        <Link 
          href="/categories" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {t('categoryDetail.browseAllCategories')}
        </Link>
      </div>
    );
  }

  // Convert Decimal prices to numbers
  const products = category.products.map(product => {
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
      ...product,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs for child categories */}
      {category.parent && (
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/categories" className="hover:text-gray-700">
                Categories
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <Link 
                href={`/categories/${category.parent.slug}`}
                className="hover:text-gray-700"
              >
                {category.parent.name}
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{category.name}</span>
            </li>
          </ol>
        </nav>
      )}

      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      
      {category.description && (
        <p className="text-gray-600 mb-8">{category.description}</p>
      )}

      {/* Show subcategories for parent categories */}
      {!category.parent && (
        <div className="mb-8">
          {category.children.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {category.children.map(child => (
                <Link 
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {child.image ? (
                      <img 
                        src={child.image} 
                        alt={child.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl text-gray-400">📂</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-orange-600 transition-colors">
                      {child.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {child._count.products} {child._count.products === 1 ? t('categories.product') : t('categories.products')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <div className="text-5xl sm:text-6xl mb-4">📦</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                {t('categories.noProductsAvailable')}
              </h3>
              <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto px-4">
                {t('categories.noSubcategoriesOrProducts').replace('{category}', category.name)}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {t('categories.checkBackLater')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Products section - only show for child categories or parent categories with direct products */}
      {(category.parent || products.length > 0) && (
        <>
          {products.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('common.products')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                  />
                ))}
              </div>
            </div>
          ) : category.parent && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500 mb-4">
                No products available in {category.name} yet.
              </p>
              <Link 
                href="/products" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Browse all products
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
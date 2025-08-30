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
            {t('categoryDetail.noProducts').replace('{category}', category.name)}
          </p>
          <Link 
            href="/products" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {t('categoryDetail.browseAllProducts')}
          </Link>
        </div>
      )}
    </div>
  );
} 
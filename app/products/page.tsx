import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { getProductDisplayPrice } from "@/lib/utils";
import { ProductsClient } from "@/components/products/products-client";

// Add revalidation - cache for 3 minutes
export const revalidate = 180;

interface SearchParams {
  page?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  parentCategory?: string;
  hasSale?: string;
}

function buildWhereClause(params: SearchParams) {
  const now = new Date();
  const conditions: object[] = [];

  // Category filter (parent category - products in subcategories of this parent)
  if (params.parentCategory) {
    conditions.push({
      category: {
        OR: [
          { parentId: params.parentCategory },
          { id: params.parentCategory },
        ],
      },
    });
  }

  // Price range: SIMPLE uses product.price; STORAGE uses storage prices
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
  if (minPrice != null && !isNaN(minPrice) && maxPrice != null && !isNaN(maxPrice) && maxPrice >= minPrice) {
    conditions.push({
      OR: [
        {
          productType: 'SIMPLE',
          price: { gte: minPrice, lte: maxPrice },
        },
        {
          productType: 'STORAGE',
          storages: {
            some: { price: { gte: minPrice, lte: maxPrice } },
          },
        },
      ],
    });
  } else if (minPrice != null && !isNaN(minPrice)) {
    conditions.push({
      OR: [
        { productType: 'SIMPLE', price: { gte: minPrice } },
        { productType: 'STORAGE', storages: { some: { price: { gte: minPrice } } } },
      ],
    });
  } else if (maxPrice != null && !isNaN(maxPrice)) {
    conditions.push({
      OR: [
        { productType: 'SIMPLE', price: { lte: maxPrice } },
        { productType: 'STORAGE', storages: { some: { price: { lte: maxPrice } } } },
      ],
    });
  }

  // Has sale filter
  if (params.hasSale === 'true' || params.hasSale === '1') {
    conditions.push({
      OR: [
        {
          sale: { not: null },
          saleEndDate: { gt: now },
        },
        {
          salePrice: { not: null },
          saleEndDate: { gt: now },
        },
        {
          storages: {
            some: {
              salePercentage: { not: null },
              saleEndDate: { gt: now },
            },
          },
        },
      ],
    });
  }

  if (conditions.length === 0) return undefined;
  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams?.page;
  
  const ITEMS_PER_PAGE = 12;
  const currentPage = pageParam ? parseInt(pageParam as string, 10) : 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const where = buildWhereClause(resolvedSearchParams || {});

  // Get total products count with filters
  const totalProducts = await prisma.product.count({ where });
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: true,
      reviews: {
        select: {
          rating: true,
        },
      },
      storages: {
        include: {
          units: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' // Default sort by newest
    },
    skip,
    take: ITEMS_PER_PAGE,
  });

  const parentCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
  });
  const maxPriceResult = await prisma.product.aggregate({
    _max: { price: true },
  });
  const maxStoragePrice = await prisma.productStorage.aggregate({
    _max: { price: true },
  });
  const maxProductPrice = Math.max(
    Number(maxPriceResult._max.price) || 0,
    Number(maxStoragePrice._max.price) || 0
  );

  // Convert Decimal to number before passing to client components
  const serializedProducts = products.map(product => {
    // Get display pricing (prioritizes storage with stock)
    const displayPrice = getProductDisplayPrice({
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      sale: product.sale ?? null,
      saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
      storages: product.storages.map(storage => ({
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
      }))
    });

    return {
      ...product,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      taxStatus: displayPrice.taxStatus ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      storages: product.storages.map(storage => {
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
      })
    };
  });

  const clientSearchParams = {
    page: pageParam,
    minPrice: resolvedSearchParams?.minPrice,
    maxPrice: resolvedSearchParams?.maxPrice,
    parentCategory: resolvedSearchParams?.parentCategory,
    hasSale: resolvedSearchParams?.hasSale,
  };

  return (
    <ProductsClient 
      initialProducts={serializedProducts}
      parentCategories={parentCategories}
      maxPrice={maxProductPrice}
      isAdmin={isAdmin}
      searchParams={clientSearchParams}
      totalPages={totalPages}
    />
  );
} 
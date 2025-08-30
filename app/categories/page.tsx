// This remains a server component (no 'use client')
import { prisma } from "@/lib/prisma";
import { CategoriesGrid } from "@/components/categories/categories-grid";

// Add revalidation - cache for 10 minutes
export const revalidate = 600;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: {
      // Only include categories that have at least one product
      products: {
        some: {}
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          slug: true,
        },
        take: 4, // Only fetch 4 products per category for preview
      },
    },
  });

  // Convert Decimal to number for prices
  const serializedCategories = categories.map(category => ({
    ...category,
    products: category.products.map(product => ({
      ...product,
      price: Number(product.price),
    })),
  }));

  return <CategoriesGrid categories={serializedCategories} />;
} 
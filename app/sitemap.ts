import { MetadataRoute } from 'next';
import { prisma } from "@/lib/prisma";

/**
 * Generate a sitemap for the application
 * This will be served at /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com';
  
  // Base URLs (static pages)
  const staticPages = [
    '',
    '/products',
    '/categories',
    '/most-selling',
    '/deals',
    '/contact',
    '/branches',
    '/reviews',
    '/login',
    '/signup',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch all products
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const productUrls = products.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const categoryUrls = categories.map(category => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Combine all URLs
  return [...staticPages, ...productUrls, ...categoryUrls];
} 
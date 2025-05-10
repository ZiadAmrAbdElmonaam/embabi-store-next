import { MetadataRoute } from 'next';

/**
 * Generate robots.txt rules
 * This will be served at /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/(auth)/',
        '/reset-password',
        '/verify',
        '/cart',
        '/checkout',
        '/orders',
        '/profile',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 
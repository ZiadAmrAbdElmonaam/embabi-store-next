'use client';

import { usePathname } from 'next/navigation';

interface OrganizationStructuredDataProps {
  name?: string;
  logo?: string;
  url?: string;
}

interface ProductStructuredDataProps {
  name: string;
  description: string;
  images: string[];
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock';
  sku?: string;
  brand?: string;
  reviews?: Array<{
    author: string;
    rating: number;
    content: string;
  }>;
}

export function OrganizationStructuredData({
  name = 'Embabi Store',
  logo = '/logo.png',
  url,
}: OrganizationStructuredDataProps) {
  const pathname = usePathname();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com';
  const organizationUrl = url || siteUrl;
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: organizationUrl,
    logo: `${siteUrl}${logo.startsWith('/') ? logo : `/${logo}`}`,
    sameAs: [
      'https://facebook.com/embabistore',
      'https://instagram.com/embabistore',
      'https://twitter.com/embabistore'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+20-123-456-7890',
      contactType: 'customer service',
      areaServed: 'EG',
      availableLanguage: ['English', 'Arabic']
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ProductStructuredData({
  name,
  description,
  images,
  price,
  priceCurrency = 'EGP',
  availability = 'InStock',
  sku = '',
  brand = 'Embabi Store',
  reviews = []
}: ProductStructuredDataProps) {
  const pathname = usePathname();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com';
  const productUrl = `${siteUrl}${pathname}`;
  
  // Format images URLs
  const formattedImages = images.map(image => 
    image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
  );
  
  // Format reviews
  const structuredReviews = reviews.map(review => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5'
    },
    reviewBody: review.content
  }));
  
  // Calculate aggregate rating if reviews exist
  const aggregateRating = reviews.length > 0 ? {
    '@type': 'AggregateRating',
    ratingValue: (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1),
    reviewCount: reviews.length
  } : undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: formattedImages,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency,
      price,
      availability: `https://schema.org/${availability}`
    },
    ...(reviews.length > 0 && { review: structuredReviews }),
    ...(aggregateRating && { aggregateRating })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 
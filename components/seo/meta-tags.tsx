'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  keywords?: string;
  type?: 'website' | 'product' | 'article';
  canonical?: string;
}

export function MetaTags({
  title,
  description,
  image = '/logo-social.png', // Default social image
  keywords = '',
  type = 'website',
  canonical,
}: MetaTagsProps) {
  const pathname = usePathname();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com';
  const url = canonical || `${siteUrl}${pathname}`;
  
  // Ensure title is properly formatted
  const formattedTitle = title.includes('Embabi Store') 
    ? title 
    : `${title} | Embabi Store`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image.startsWith('/') ? image : `/${image}`}`} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${image.startsWith('/') ? image : `/${image}`}`} />
    </Head>
  );
} 
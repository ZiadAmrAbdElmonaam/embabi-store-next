'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface BreadcrumbsProps {
  product?: {
    name: string;
    category?: {
      name: string;
      slug: string;
    };
  };
  category?: {
    name: string;
    slug: string;
  };
  overrides?: {
    [key: string]: string;
  };
}

export function Breadcrumbs({ product, category, overrides = {} }: BreadcrumbsProps) {
  const pathname = usePathname();
  const { t, lang } = useTranslation();
  
  // Generate breadcrumbs based on the current pathname
  const generateBreadcrumbs = () => {
    // Remove leading and trailing slashes, then split by slashes
    const pathSegments = pathname.replace(/^\/|\/$/g, '').split('/');
    
    // Start with home
    const breadcrumbs = [
      { name: t('breadcrumbs.home'), href: '/' }
    ];
    
    let currentPath = '';
    
    // Handle special cases first
    if (product && product.category) {
      return [
        { name: t('breadcrumbs.home'), href: '/' },
        { name: t('breadcrumbs.products'), href: '/products' },
        { name: product.category.name, href: `/categories/${product.category.slug}` },
        { name: product.name, href: pathname }
      ];
    }
    
    if (category) {
      return [
        { name: t('breadcrumbs.home'), href: '/' },
        { name: t('breadcrumbs.categories'), href: '/categories' },
        { name: category.name, href: pathname }
      ];
    }
    
    // Handle normal paths
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      
      // Skip dynamic segments (those that start with [)
      if (segment.startsWith('[') || !segment) continue;
      
      // Get the translated name for this segment
      let name = '';
      
      // Use overrides if available
      if (overrides[segment]) {
        name = overrides[segment];
      } else {
        // Try to get a translation key based on the segment
        const translationKey = `breadcrumbs.${segment}`;
        const translated = t(translationKey);
        
        // If we got back the same key, it means there's no translation
        name = translated === translationKey
          ? segment.charAt(0).toUpperCase() + segment.slice(1)
          : translated;
      }
      
      breadcrumbs.push({
        name,
        href: currentPath
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Schema.org structured data for breadcrumbs
  const breadcrumbsStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com'}${breadcrumb.href}`,
        'name': breadcrumb.name
      }
    }))
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="py-3 px-4 bg-gray-50 rounded-lg shadow-sm mb-4">
        <ol className={`flex flex-wrap items-center ${lang === 'ar' ? 'space-x-reverse' : 'space-x-2'}`}>
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className={`mx-2 h-4 w-4 text-gray-400 flex-shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              )}
              
              {index === 0 && (
                <Home className="mr-1 h-4 w-4 text-gray-500" />
              )}
              
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-700 font-medium">{breadcrumb.name}</span>
              ) : (
                <Link 
                  href={breadcrumb.href} 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      
      {/* Add structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsStructuredData) }}
      />
    </>
  );
} 
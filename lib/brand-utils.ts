/**
 * Brand Utilities
 * Functions for grouping categories by brand and managing brand logic
 */

export interface BrandGroup {
  brand: string;
  icon: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image?: string;
    productCount: number;
  }>;
  totalProducts: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  brand?: string | null;
  parentId?: string | null;
  _count?: {
    products: number;
  };
}

/**
 * Group subcategories by their brand
 */
export function groupCategoriesByBrand(categories: Category[]): BrandGroup[] {
  // Filter only subcategories (those with parentId) that have products
  const subcategories = categories.filter(cat => 
    cat.parentId && // Must be a subcategory
    cat._count && cat._count.products > 0 // Must have products
  );

  // Group by brand
  const brandMap = new Map<string, Category[]>();
  
  subcategories.forEach(category => {
    const brand = category.brand || 'Other';
    if (!brandMap.has(brand)) {
      brandMap.set(brand, []);
    }
    brandMap.get(brand)!.push(category);
  });

  // Convert to BrandGroup array
  const brandGroups: BrandGroup[] = [];
  
  brandMap.forEach((categories, brand) => {
    const totalProducts = categories.reduce((sum, cat) => 
      sum + (cat._count?.products || 0), 0
    );

    brandGroups.push({
      brand,
      icon: getBrandIcon(brand),
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image || undefined,
        productCount: cat._count?.products || 0
      })),
      totalProducts
    });
  });

  // Sort by total products (descending) and then by brand name
  return brandGroups.sort((a, b) => {
    if (a.brand === 'Other') return 1; // Other goes last
    if (b.brand === 'Other') return -1;
    if (b.totalProducts !== a.totalProducts) {
      return b.totalProducts - a.totalProducts; // More products first
    }
    return a.brand.localeCompare(b.brand); // Alphabetical
  });
}

/**
 * Get brand icon/emoji
 */
export function getBrandIcon(brand: string): string {
  const brandIcons: { [key: string]: string } = {
    'Apple': '🍎',
    'Samsung': '📱',
    'OnePlus': '➕',
    'Sony': '🎵',
    'Garmin': '⌚',
    'Dell': '💻',
    'HP': '🖥️',
    'Microsoft': '🖱️',
    'Google': '🔍',
    'Xiaomi': '📲',
    'Huawei': '📡',
    'LG': '📺',
    'Asus': '⚡',
    'Lenovo': '💼',
    'Acer': '🎮',
    'Other': '📦'
  };

  return brandIcons[brand] || '🏷️';
}

/**
 * Get all unique brands from categories
 */
export function getUniqueBrands(categories: Category[]): string[] {
  const brands = new Set<string>();
  
  categories.forEach(category => {
    if (category.brand && category.parentId) { // Only subcategories with brands
      brands.add(category.brand);
    }
  });

  return Array.from(brands).sort();
}

/**
 * Format brand name for display
 */
export function formatBrandName(brand: string): string {
  if (brand === 'Other') return 'Other Brands';
  return brand;
}

/**
 * Get categories for a specific brand
 */
export function getCategoriesForBrand(categories: Category[], brand: string): Category[] {
  return categories.filter(cat => 
    cat.parentId && // Must be subcategory
    cat.brand === brand &&
    cat._count && cat._count.products > 0 // Must have products
  );
}

/**
 * Get brand color theme
 */
export function getBrandTheme(brand: string): { bg: string; text: string; border: string } {
  const themes: { [key: string]: { bg: string; text: string; border: string } } = {
    'Apple': { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-300' },
    'Samsung': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    'OnePlus': { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
    'Sony': { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
    'Garmin': { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
    'Dell': { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
    'HP': { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' },
    'Microsoft': { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' },
    'Other': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  };

  return themes[brand] || { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' };
}

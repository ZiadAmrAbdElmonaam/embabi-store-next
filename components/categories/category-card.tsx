'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
}

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    isParent?: boolean;
    isChild?: boolean;
    parentName?: string;
    products: Product[];
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();
  
  // Check if the category has products
  const hasProducts = category.products.length > 0;

  return (
    <motion.div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Category Card */}
      <Link
        href={`/categories/${category.slug}`}
        className={`block relative h-64 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${!hasProducts ? 'opacity-70' : ''}`}
      >
        {/* Category Image */}
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className={`object-cover ${!hasProducts ? 'grayscale' : ''}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100" />
        )}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          whileHover={{ opacity: 0.8 }}
          transition={{ duration: 0.2 }}
        />
        <motion.div
          className="absolute bottom-0 left-0 p-6"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          {/* Category Type Badge */}
          {category.isParent && (
            <div className="mb-2">
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                Main Category
              </span>
            </div>
          )}
          {category.isChild && (
            <div className="mb-2">
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                {category.parentName}
              </span>
            </div>
          )}
          
          <h3 className="text-xl font-semibold text-white">{category.name}</h3>
          <p className="text-white/80 text-sm mt-1">
            {hasProducts ? (
              <>
                {category.products.length} <TranslatedContent translationKey="categories.products" />
              </>
            ) : (
              <span className="text-yellow-300">
                <TranslatedContent translationKey="categories.noProducts" />
              </span>
            )}
          </p>
        </motion.div>
      </Link>

      {/* Products Preview Popup */}
      <AnimatePresence>
        {isHovered && hasProducts && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl p-4 z-20"
          >
            <div className="grid grid-cols-2 gap-3">
              {category.products.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="block group/product"
                  >
                    <div className="relative aspect-square rounded-md overflow-hidden">
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover transition-all duration-300 group-hover/product:scale-110"
                        />
                      )}
                      <motion.div
                        className="absolute inset-0 bg-black/0 group-hover/product:bg-black/20 transition-all duration-300"
                        whileHover={{ opacity: 1 }}
                      />
                    </div>
                    <motion.div
                      className="mt-2"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h4 className="text-sm font-medium text-gray-900 truncate group-hover/product:text-orange-600">
                        {product.name}
                      </h4>
                      <p className="text-sm font-medium text-orange-600">
                        {formatPrice(product.price)}
                      </p>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {category.products.length > 4 && (
              <motion.div
                className="mt-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-sm text-gray-500">
                  +{category.products.length - 4} <TranslatedContent translationKey="categories.products" />
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 
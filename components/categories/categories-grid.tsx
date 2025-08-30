'use client';

import { motion } from 'framer-motion';
import { CategoryCard } from "./category-card";
import { TranslatedContent } from '@/components/ui/translated-content';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface CategoriesGridProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image?: string;
    isParent?: boolean;
    isChild?: boolean;
    parentName?: string;
    products: Array<{
      id: string;
      name: string;
      price: number;
      images: string[];
      slug: string;
    }>;
  }>;
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-8"
        >
          <TranslatedContent translationKey="categories.title" />
        </motion.h1>
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </motion.div>
      </div>
    </div>
  );
} 
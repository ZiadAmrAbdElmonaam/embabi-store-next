'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronRight, FolderOpen, Tag } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId: string | null;
  brand: string | null;
  _count: {
    products: number;
    children?: number;
  };
  children?: Category[];
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    categoryId: '',
    categoryName: ''
  });
  const { t } = useTranslation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error(t('admin.failedToDeleteCategory'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Extract error message from the response
        const errorMessage = data.error || t('admin.failedToDeleteCategory');
        throw new Error(errorMessage);
      }
      
      toast.success(t('admin.categoryDeleted'));
      setDeleteDialog({ isOpen: false, categoryId: '', categoryName: '' });
      fetchCategories(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="text-center">{t('admin.loading')}</div>;
  }

  // Organize categories into parent-child hierarchy
  const parentCategories = categories.filter(cat => !cat.parentId);
  const childCategoriesMap = new Map<string, Category[]>();
  categories.forEach(cat => {
    if (cat.parentId) {
      if (!childCategoriesMap.has(cat.parentId)) {
        childCategoriesMap.set(cat.parentId, []);
      }
      childCategoriesMap.get(cat.parentId)?.push(cat);
    }
  });

  const renderCategoryRow = (category: Category, isChild = false) => (
    <tr key={category.id} className={`border-b hover:bg-gray-50 ${isChild ? 'bg-blue-50/30' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isChild ? (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-4" />
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">{category.name}</span>
              {category.brand && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                  {t('admin.brand')}: {category.brand}
                </span>
              )}
            </>
          ) : (
            <>
              <FolderOpen className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-900">{category.name}</span>
              {childCategoriesMap.has(category.id) && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2">
                  {childCategoriesMap.get(category.id)?.length} {t('admin.subcategories')}
                </span>
              )}
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {category.image ? (
          <div className="relative w-12 h-12">
            <img
              src={category.image}
              alt={category.name}
              className="rounded-lg object-cover w-full h-full"
            />
          </div>
        ) : (
          <span className="text-gray-400 text-sm">{t('admin.noCategoryImage')}</span>
        )}
      </td>
      <td className="px-6 py-4">
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
      </td>
      <td className="px-6 py-4">
        <span className={`font-medium ${category._count.products > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {category._count.products}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {t('admin.edit')}
          </Link>
          <button
            onClick={() => setDeleteDialog({
              isOpen: true,
              categoryId: category.id,
              categoryName: category.name
            })}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            {t('admin.delete')}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.categorySubcategory')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.image')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.slug')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.products')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parentCategories.map((parent) => (
              <>
                {renderCategoryRow(parent, false)}
                {childCategoriesMap.get(parent.id)?.map(child => renderCategoryRow(child, true))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, categoryId: '', categoryName: '' })}
        onConfirm={() => handleDelete(deleteDialog.categoryId)}
        title={t('admin.deleteCategory')}
        message={t('admin.deleteCategoryConfirm').replace('{name}', deleteDialog.categoryName)}
      />
    </>
  );
} 
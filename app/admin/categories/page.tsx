'use client';

import { CategoryList } from "@/components/admin/category-list";
import { InstructionDialog } from "@/components/admin/instruction-dialog";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();

  const categoryInstructions = [
    {
      step: 1,
      title: t('admin.chooseCategoryType'),
      description: t('admin.chooseCategoryTypeDesc'),
      details: [t('admin.parentCategoryHint'), t('admin.subcategoryHint')],
    },
    {
      step: 2,
      title: t('admin.fillCategoryInfo'),
      description: t('admin.fillCategoryInfoDesc'),
      details: [t('admin.categoryNameHint'), t('admin.categoryDescHint')],
    },
    {
      step: 3,
      title: t('admin.setParentCategory'),
      description: t('admin.setParentCategoryDesc'),
      details: [t('admin.parentCategoryDropdownHint'), t('admin.parentCategoryExample')],
    },
    {
      step: 4,
      title: t('admin.addBrandName'),
      description: t('admin.addBrandNameDesc'),
      details: [t('admin.brandFieldHint'), t('admin.brandTypicallyHint'), t('admin.brandUsedForHint')],
    },
    {
      step: 5,
      title: t('admin.categoryImage'),
      description: t('admin.categoryImageDesc'),
      details: [t('admin.imageFilenameHint'), t('admin.imageSizeHint'), t('admin.imageFormatHint')],
    },
    {
      step: 6,
      title: t('admin.saveViewHierarchy'),
      description: t('admin.saveViewHierarchyDesc'),
      details: [t('admin.parentIconHint'), t('admin.subcategoryIconHint'), t('admin.editDeleteHint')],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('admin.categories')}</h1>
        <div className="flex items-center gap-3">
          <InstructionDialog
            title={t('admin.howToAddCategory')}
            instructions={categoryInstructions}
          />
          <Link
            href="/admin/categories/new"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            <Plus className="w-4 h-4" />
            {t('admin.addCategory')}
          </Link>
        </div>
      </div>

      <CategoryList />
    </div>
  );
} 
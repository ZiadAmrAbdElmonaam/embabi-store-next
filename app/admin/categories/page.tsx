import { CategoryList } from "@/components/admin/category-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function AdminCategoriesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Link>
      </div>

      <CategoryList />
    </div>
  );
} 
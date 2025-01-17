import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Category</h1>
      <CategoryForm />
    </div>
  );
} 
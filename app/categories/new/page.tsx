import { CategoryForm } from "@/components/categories/category-form";

export default function NewCategoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Category</h1>
      <CategoryForm />
    </div>
  );
} 
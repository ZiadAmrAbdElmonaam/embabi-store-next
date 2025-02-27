import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/categories/category-form";
import { notFound } from "next/navigation";

interface EditCategoryPageProps {
  params: {
    categoryId: string;
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: {
      id: params.categoryId,
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Category</h1>
      </div>
      <CategoryForm initialData={category} />
    </div>
  );
} 
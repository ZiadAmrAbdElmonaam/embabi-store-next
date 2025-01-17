import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
} 
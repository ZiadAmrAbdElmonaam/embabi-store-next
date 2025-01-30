import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage() {
  // Fetch categories for the select dropdown
  const categories = await prisma.category.findMany();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
} 
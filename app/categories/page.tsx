import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        {isAdmin && (
          <Link
            href="/categories/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Category
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
            {category.description && (
              <p className="text-gray-600 mb-4">{category.description}</p>
            )}
            <p className="text-sm text-gray-500">
              {category._count.products} products
            </p>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No categories found. Create your first category!
        </p>
      )}
    </div>
  );
} 
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Category
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Slug</th>
              <th className="px-6 py-3 text-left">Products</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b">
                <td className="px-6 py-4">{category.name}</td>
                <td className="px-6 py-4">{category.slug}</td>
                <td className="px-6 py-4">{category._count.products}</td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure? This will also delete all products in this category!')) {
                        await fetch(`/api/categories/${category.id}`, {
                          method: 'DELETE',
                        });
                        window.location.reload();
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
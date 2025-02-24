'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure? This will also delete all products in this category!')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');
      
      toast.success('Category deleted successfully');
      fetchCategories(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
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
                  onClick={() => handleDelete(category.id)}
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
  );
} 
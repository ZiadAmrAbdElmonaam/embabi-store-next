'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count: {
    products: number;
  };
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    categoryId: '',
    categoryName: ''
  });

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
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Extract error message from the response
        const errorMessage = data.error || 'Failed to delete category';
        throw new Error(errorMessage);
      }
      
      toast.success('Category deleted successfully');
      setDeleteDialog({ isOpen: false, categoryId: '', categoryName: '' });
      fetchCategories(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Image</th>
              <th className="px-6 py-3 text-left">Slug</th>
              <th className="px-6 py-3 text-left">Products</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b">
                <td className="px-6 py-4">{category.name}</td>
                <td className="px-6 py-4">
                  {category.image ? (
                    <div className="relative w-12 h-12">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="rounded-lg object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </td>
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
                    onClick={() => setDeleteDialog({
                      isOpen: true,
                      categoryId: category.id,
                      categoryName: category.name
                    })}
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

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, categoryId: '', categoryName: '' })}
        onConfirm={() => handleDelete(deleteDialog.categoryId)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteDialog.categoryName}"? This will also delete all products in this category!`}
      />
    </>
  );
} 
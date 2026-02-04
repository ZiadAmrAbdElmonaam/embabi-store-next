'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  brand: string | null;
}

interface CategoryFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    image?: string;
    parentId?: string | null;
    brand?: string | null;
  };
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    parentId: initialData?.parentId || "",
    brand: initialData?.brand || "",
  });

  useEffect(() => {
    // Fetch parent categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Filter only parent categories (those without parentId)
        const parentCategories = data.filter((cat: Category) => !cat.parentId);
        setCategories(parentCategories);
      })
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id 
        ? `/api/categories/${initialData.id}`
        : '/api/categories';

      // Create image path based on slug
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const imagePath = `/images/categories/${slug}.png`;

      const response = await fetch(url, {
        method: initialData?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          image: imagePath,
          parentId: formData.parentId || null,
          brand: formData.parentId && formData.brand ? formData.brand : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      router.push('/admin/categories');
      router.refresh();
      toast.success(initialData?.id ? 'Category updated' : 'Category created');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isSubcategory = !!formData.parentId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Type Selection */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Category Structure</h3>
            <p className="text-xs text-blue-700 mb-2">
              Choose whether this is a <strong>Parent Category</strong> (main category like "Electronics") or a <strong>Subcategory</strong> (specific brand/type under a parent).
            </p>
          </div>
        </div>
      </div>

      {/* Parent Category Selection */}
      <div>
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
          Category Type <span className="text-red-500">*</span>
        </label>
        <select
          id="parentId"
          value={formData.parentId}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value, brand: '' })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
        >
          <option value="">Parent Category (Main Category)</option>
          <optgroup label="Subcategory under:">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {formData.parentId ? '✓ This will be a subcategory' : '✓ This will be a main parent category'}
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {isSubcategory ? 'Subcategory' : 'Category'} Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          placeholder={isSubcategory ? "e.g., iPhone, Samsung, LG" : "e.g., Electronics, Clothing, Home Appliances"}
        />
      </div>

      {/* Brand Field - Only for Subcategories */}
      {isSubcategory && (
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
            Brand Name <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            id="brand"
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="e.g., Apple, Samsung, LG"
          />
          <p className="mt-1 text-xs text-gray-500">
            Brand name for filtering and display (typically same as subcategory name)
          </p>
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          placeholder="Enter category description"
        />
      </div>

      {/* Category Image Info */}
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-700">
            Category images should be placed in the <code>/public/images/categories/</code> folder with the name matching the category slug (e.g., <code>iphones.png</code> for the "iphones" category).
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            initialData?.id ? 'Update Category' : 'Create Category'
          )}
        </button>
      </div>
    </form>
  );
} 
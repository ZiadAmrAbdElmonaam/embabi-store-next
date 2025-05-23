'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  sale: number | null;
  salePrice: number | null;
  saleEndDate: string | null;
  category: {
    name: string;
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      // Check sale end dates
      data.forEach(product => {
        if (product.saleEndDate) {
          const endDate = new Date(product.saleEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        }
      });
      
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Extract error message from the response
        const errorMessage = data.error || 'Failed to delete product';
        throw new Error(errorMessage);
      }
      
      toast.success('Product deleted successfully');
      fetchProducts(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      toast.error(errorMessage);
      console.error('Failed to delete product:', error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Image</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Price (EGP)</th>
              <th className="px-6 py-3 text-left">Sale</th>
              <th className="px-6 py-3 text-left">Stock</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-6 py-4">
                  {product.images[0] && (
                    <div className="relative w-20 h-20">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{product.name}</td>
                <td className="px-6 py-4">{product.category.name}</td>
                <td className="px-6 py-4">{product.price.toFixed(2)} EGP</td>
                <td className="px-6 py-4">
                  {product.sale ? (
                    <div>
                      <span className="text-green-600 font-medium">{product.sale}%</span>
                      {product.saleEndDate && (
                        <div className="text-xs text-gray-500">
                          Until {new Date(product.saleEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">No sale</span>
                  )}
                </td>
                <td className="px-6 py-4">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
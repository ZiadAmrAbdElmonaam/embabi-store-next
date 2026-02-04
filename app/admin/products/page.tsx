'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { InstructionDialog } from '@/components/admin/instruction-dialog';
import { useTranslation } from '@/hooks/use-translation';

interface Product {
  id: string;
  name: string;
  price: number | null;
  stock: number | null;
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
  const { t } = useTranslation();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      // Check sale end dates
      data.forEach((product: Product) => {
        if (product.saleEndDate) {
          const endDate = new Date(product.saleEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        }
      });
      
      setProducts(data);
    } catch (error) {
      toast.error(t('admin.failedToDelete'));
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;

    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const headers = await getCsrfHeaders();
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Extract error message from the response
        const errorMessage = data.error || t('admin.failedToDelete');
        throw new Error(errorMessage);
      }
      
      toast.success(t('admin.productDeleted'));
      fetchProducts(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('admin.failedToDelete');
      toast.error(errorMessage);
      console.error('Failed to delete product:', error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">{t('admin.loadingProducts')}</div>;
  }

  const productInstructions = [
    {
      step: 1,
      title: t('admin.chooseProductType'),
      description: t('admin.chooseProductTypeDesc'),
      details: [t('admin.simpleProductHint'), t('admin.storageProductHint')],
    },
    {
      step: 2,
      title: t('admin.fillBasicInfo'),
      description: t('admin.fillBasicInfoDesc'),
      details: [t('admin.nameHint'), t('admin.categoryHint'), t('admin.imagesHint')],
    },
    {
      step: 3,
      title: t('admin.setPricingStock'),
      description: t('admin.setPricingStockDesc'),
      details: [t('admin.simplePricingHint'), t('admin.storagePricingHint')],
    },
    {
      step: 4,
      title: t('admin.addTaxInfo'),
      description: t('admin.addTaxInfoDesc'),
      details: [t('admin.taxPaidHint'), t('admin.taxUnpaidHint'), t('admin.taxTypeHint')],
    },
    {
      step: 5,
      title: t('admin.configureSales'),
      description: t('admin.configureSalesDesc'),
      details: [t('admin.simpleSaleHint'), t('admin.storageSaleHint'), t('admin.saleAppliesHint')],
    },
    {
      step: 6,
      title: t('admin.savePreview'),
      description: t('admin.savePreviewDesc'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('admin.products')}</h1>
        <div className="flex items-center gap-3">
          <InstructionDialog
            title={t('admin.howToAddProduct')}
            instructions={productInstructions}
          />
          <Link
            href="/admin/products/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t('admin.addProduct')}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">{t('admin.image')}</th>
              <th className="px-6 py-3 text-left">{t('admin.name')}</th>
              <th className="px-6 py-3 text-left">{t('admin.category')}</th>
              <th className="px-6 py-3 text-left">{t('admin.price')} (EGP)</th>
              <th className="px-6 py-3 text-left">{t('admin.sale')}</th>
              <th className="px-6 py-3 text-left">{t('admin.stock')}</th>
              <th className="px-6 py-3 text-left">{t('admin.actions')}</th>
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
                <td className="px-6 py-4">{product.price != null ? product.price.toFixed(2) : '—'} EGP</td>
                <td className="px-6 py-4">
                  {product.sale ? (
                    <div>
                      <span className="text-green-600 font-medium">{product.sale}%</span>
                      {product.saleEndDate && (
                        <div className="text-xs text-gray-500">
                          {t('admin.until')} {new Date(product.saleEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">{t('admin.noSale')}</span>
                  )}
                </td>
                <td className="px-6 py-4">{product.stock ?? '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {t('admin.edit')}
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('admin.delete')}
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
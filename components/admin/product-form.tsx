'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category, Product, ProductVariant, ProductDetail } from "@prisma/client";
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { X, Plus, Loader2 } from 'lucide-react';

interface SerializedProduct extends Omit<Product, 'price' | 'salePrice' | 'discountPrice' | 'sale' | 'createdAt' | 'updatedAt' | 'saleEndDate'> {
  price: string;
  salePrice: string | null;
  discountPrice: string | null;
  sale: string | null;
  createdAt: string;
  updatedAt: string;
  saleEndDate: string | null;
  variants: ProductVariant[];
  details: ProductDetail[];
  storages: ProductStorage[];
}

interface ProductFormProps {
  categories: Category[];
  initialData?: SerializedProduct;
}

interface ColorVariant {
  color: string;
  quantity: number;
}

interface ProductDetail {
  label: string;
  description: string;
}

interface ProductStorage {
  id?: string;
  size: string;
  price: string;
  stock: number;
  salePercentage?: string;
  saleEndDate?: string;
  variants: StorageColorVariant[];
}

interface StorageColorVariant {
  color: string;
  quantity: number;
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableImages, setAvailableImages] = useState<Array<{url: string, source: string, originalFilename?: string, publicId?: string}>>([]);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [thumbnails, setThumbnails] = useState<string[]>(initialData?.thumbnails || []);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(
    initialData?.variants.map(v => ({ color: v.color, quantity: v.quantity })) || []
  );
  const [details, setDetails] = useState<ProductDetail[]>(
    initialData?.details.map(d => ({ label: d.label, description: d.description })) || []
  );
  const [storages, setStorages] = useState<ProductStorage[]>(
    initialData?.storages?.map(s => ({
      id: s.id,
      size: s.size,
      price: s.price.toString(),
      stock: s.stock,
      salePercentage: s.salePercentage?.toString() || "",
      saleEndDate: s.saleEndDate ? new Date(s.saleEndDate).toISOString().split('T')[0] : "",
      variants: s.variants?.map(v => ({ color: v.color, quantity: v.quantity })) || []
    })) || []
  );
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    sale: initialData?.sale || "",
    saleEndDate: initialData?.saleEndDate ? new Date(initialData.saleEndDate).toISOString().split('T')[0] : "",
    stock: initialData?.stock.toString() || "",
    categoryId: initialData?.categoryId || "",
  });

  useEffect(() => {
    // Fetch available images from the API (now includes both local and Cloudinary)
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images/products');
        if (!response.ok) throw new Error('Failed to fetch images');
        const images = await response.json();
        setAvailableImages(images);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to load available images');
      }
    };

    fetchImages();
  }, []);

  // Function to get image name from path or originalFilename
  const getImageName = (imagePath: string) => {
    const imageData = availableImages.find(img => img.url === imagePath);
    if (imageData && imageData.originalFilename) {
      return imageData.originalFilename.replace(/[-_]/g, ' ');
    }
    // Fallback to URL parsing for backward compatibility
    const parts = imagePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.split('.')[0].replace(/[-_]/g, ' ');
  };

  // Function to get image source badge color
  const getSourceBadgeColor = (source: string) => {
    return source === 'local' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  // Refresh available images
  const refreshImages = async () => {
    try {
      const response = await fetch('/api/images/products');
      if (response.ok) {
        const images = await response.json();
        setAvailableImages(images);
        toast.success('Image list refreshed');
      }
    } catch (error) {
      console.error('Error refreshing images:', error);
      toast.error('Failed to refresh images');
    }
  };

  // Calculate sale price
  const salePrice = formData.price && formData.sale 
    ? Number(formData.price) - (Number(formData.price) * (Number(formData.sale) / 100))
    : null;

  // Validate total quantity matches stock
  const totalQuantity = colorVariants.reduce((sum, variant) => sum + variant.quantity, 0);
  // Only check quantity mismatch when there are no storage options AND there are color variants
  const quantityMismatch = storages.length === 0 && colorVariants.length > 0 && totalQuantity !== Number(formData.stock);

  // Storage management functions
  const addStorage = () => {
    setStorages([...storages, {
      size: '',
      price: '',
      stock: 0,
      salePercentage: '',
      saleEndDate: '',
      variants: []
    }]);
  };

  const removeStorage = (index: number) => {
    setStorages(storages.filter((_, i) => i !== index));
  };

  const updateStorage = (index: number, field: keyof ProductStorage, value: any) => {
    const newStorages = [...storages];
    newStorages[index] = { ...newStorages[index], [field]: value };
    setStorages(newStorages);
  };

  const addStorageVariant = (storageIndex: number) => {
    const newStorages = [...storages];
    newStorages[storageIndex].variants.push({ color: '', quantity: 0 });
    setStorages(newStorages);
  };

  const removeStorageVariant = (storageIndex: number, variantIndex: number) => {
    const newStorages = [...storages];
    newStorages[storageIndex].variants = newStorages[storageIndex].variants.filter((_, i) => i !== variantIndex);
    setStorages(newStorages);
  };

  const updateStorageVariant = (storageIndex: number, variantIndex: number, field: keyof StorageColorVariant, value: any) => {
    const newStorages = [...storages];
    newStorages[storageIndex].variants[variantIndex] = {
      ...newStorages[storageIndex].variants[variantIndex],
      [field]: value
    };
    setStorages(newStorages);
  };

  // Calculate storage sale price
  const getStorageSalePrice = (storage: ProductStorage) => {
    if (storage.price && storage.salePercentage) {
      const price = parseFloat(storage.price);
      const salePercentage = parseFloat(storage.salePercentage);
      return price - (price * (salePercentage / 100));
    }
    return null;
  };

  // Calculate new price based on sale percentage
  const calculateNewPrice = (price: number, salePercentage: number) => {
    return price - (price * (salePercentage / 100));
  };

  // Check if sale is expired and clear it if needed
  useEffect(() => {
    if (formData.saleEndDate) {
      const endDate = new Date(formData.saleEndDate);
      const today = new Date();
      
      // If sale end date is in the past, clear the sale fields
      if (endDate < today) {
        setFormData({
          ...formData,
          sale: "",
          saleEndDate: ""
        });
        // Use toast.error instead of toast.info since 'info' might not exist
        toast.error("Sale end date was in the past and has been cleared");
      }
    }
  }, [formData.saleEndDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityMismatch) {
      toast.error(`Total color quantities (${totalQuantity}) must match stock (${formData.stock}) when no storage options are defined`);
      return;
    }

    // Validate sale end date is not in the past
    if (formData.sale && formData.saleEndDate) {
      const endDate = new Date(formData.saleEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
      
      if (endDate < today) {
        toast.error("Sale end date cannot be in the past");
        return;
      }
    } else if (formData.sale && !formData.saleEndDate) {
      toast.error("Sale end date is required when setting a sale percentage");
      return;
    }

    setLoading(true);

    try {
      const url = initialData 
        ? `/api/products/${initialData.id}`
        : '/api/products';
        
      // Format the data before sending
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sale: formData.sale ? parseFloat(formData.sale) : null,
        salePrice: salePrice,
        saleEndDate: formData.saleEndDate || null,
        images,
        thumbnails,
        details,
        variants: colorVariants,
        storages: storages.map(storage => ({
          id: storage.id,
          size: storage.size,
          price: parseFloat(storage.price),
          stock: storage.stock,
          salePercentage: storage.salePercentage ? parseFloat(storage.salePercentage) : null,
          saleEndDate: storage.saleEndDate || null,
          variants: storage.variants
        }))
      };

      const response = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
      toast.success(initialData ? 'Product updated' : 'Product created');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelection = (imagePath: string, type: 'main' | 'thumbnail') => {
    const maxFiles = type === 'main' ? 3 : 5;
    const currentFiles = type === 'main' ? images : thumbnails;
    const setFiles = type === 'main' ? setImages : setThumbnails;

    if (currentFiles.includes(imagePath)) {
      setFiles(currentFiles.filter(img => img !== imagePath));
    } else if (currentFiles.length < maxFiles) {
      setFiles([...currentFiles, imagePath]);
    } else {
      toast.error(`Maximum ${maxFiles} ${type === 'main' ? 'main images' : 'thumbnails'} allowed`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock 
            {storages.length > 0 && (
              <span className="text-sm text-gray-500 font-normal"> (Optional when storage options are defined)</span>
            )}
          </label>
          <input
            type="number"
            required={storages.length === 0}
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {storages.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              This field is optional when storage options are defined. Stock will be managed at the storage level.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing and Stock */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Sale Settings</h2>
          {(formData.sale || formData.saleEndDate) && (
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                sale: "",
                saleEndDate: ""
              })}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear Sale
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sale Percentage</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.sale}
              onChange={(e) => setFormData({ ...formData, sale: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sale End Date</label>
            <input
              type="date"
              value={formData.saleEndDate}
              onChange={(e) => setFormData({ ...formData, saleEndDate: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required={!!formData.sale}
            />
          </div>

          {formData.price && formData.sale && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Sale Price</label>
              <div className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500">
                ${calculateNewPrice(Number(formData.price), Number(formData.sale)).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color Variants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Color Variants
            {storages.length > 0 && (
              <span className="text-sm text-gray-500 font-normal"> (Optional when storage options are defined)</span>
            )}
          </h2>
          {quantityMismatch && storages.length === 0 && (
            <p className="text-sm text-red-600">
              Total quantities ({totalQuantity}) must match stock ({formData.stock})
            </p>
          )}
        </div>
        
        {storages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Color variants here are optional when storage options are defined. Colors will be managed at the storage level.
            </p>
          </div>
        )}
        
        {colorVariants.map((variant, index) => (
          <div key={index} className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Color"
              value={variant.color}
              onChange={(e) => {
                const newVariants = [...colorVariants];
                newVariants[index].color = e.target.value;
                setColorVariants(newVariants);
              }}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            />
            <input
              type="number"
              min="0"
              placeholder="Quantity"
              value={variant.quantity}
              onChange={(e) => {
                const newVariants = [...colorVariants];
                newVariants[index].quantity = Number(e.target.value);
                setColorVariants(newVariants);
              }}
              className="w-32 rounded-md border border-gray-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                setColorVariants(colorVariants.filter((_, i) => i !== index));
              }}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setColorVariants([...colorVariants, { color: '', quantity: 0 }])}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Color Variant
        </button>
      </div>

      {/* Storage Options */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Storage Options (Optional)</h2>
          <p className="text-sm text-gray-600">Define different storage variants with their own pricing and colors</p>
        </div>

        {storages.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> When storage options are defined, customers will select storage first, then choose from available colors for that storage option.
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              <strong>Stock Management:</strong> Stock is managed at the storage level. The main product stock and color variants above are optional when storage options are present.
            </p>
          </div>
        )}

        {storages.map((storage, storageIndex) => (
          <div key={storageIndex} className="border border-gray-200 rounded-lg p-6 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Storage Option {storageIndex + 1}</h3>
              <button
                type="button"
                onClick={() => removeStorage(storageIndex)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Storage Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Size</label>
                <input
                  type="text"
                  placeholder="e.g., 128GB, 256GB, 512GB"
                  value={storage.size}
                  onChange={(e) => updateStorage(storageIndex, 'size', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={storage.price}
                  onChange={(e) => updateStorage(storageIndex, 'price', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={storage.stock}
                  onChange={(e) => updateStorage(storageIndex, 'stock', parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Sale Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Percentage (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  value={storage.salePercentage}
                  onChange={(e) => updateStorage(storageIndex, 'salePercentage', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale End Date (Optional)</label>
                <input
                  type="date"
                  value={storage.saleEndDate}
                  onChange={(e) => updateStorage(storageIndex, 'saleEndDate', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Price Display */}
            {storage.price && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Original Price:</span>
                    <span className="ml-2 font-medium">${parseFloat(storage.price || '0').toFixed(2)}</span>
                  </div>
                  {storage.salePercentage && (
                    <div>
                      <span className="text-sm text-gray-600">Sale Price:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ${getStorageSalePrice(storage)?.toFixed(2)}
                      </span>
                      <span className="ml-2 text-sm text-green-600">
                        ({storage.salePercentage}% off)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Color Variants for this Storage */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Color Variants for {storage.size || 'this storage'}</h4>
                <div className="text-sm text-gray-600">
                  Total: {storage.variants.reduce((sum, v) => sum + v.quantity, 0)} / {storage.stock}
                </div>
              </div>

              {storage.variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="flex items-center gap-4 bg-white p-3 rounded border">
                  <input
                    type="text"
                    placeholder="Color (e.g., Black, White, Blue)"
                    value={variant.color}
                    onChange={(e) => updateStorageVariant(storageIndex, variantIndex, 'color', e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={variant.quantity}
                    onChange={(e) => updateStorageVariant(storageIndex, variantIndex, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-24 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeStorageVariant(storageIndex, variantIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addStorageVariant(storageIndex)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-3 w-3" />
                Add Color Variant
              </button>

              {/* Validation for storage variants */}
              {storage.variants.length > 0 && (
                <div className="text-sm">
                  {storage.variants.reduce((sum, v) => sum + v.quantity, 0) !== storage.stock && (
                    <p className="text-red-600">
                      Color quantities ({storage.variants.reduce((sum, v) => sum + v.quantity, 0)}) must match storage stock ({storage.stock})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addStorage}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Storage Option
        </button>
      </div>

      {/* Product Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Product Details</h2>
        
        {details.map((detail, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Label"
                value={detail.label}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].label = e.target.value;
                  setDetails(newDetails);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Description"
                value={detail.description}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].description = e.target.value;
                  setDetails(newDetails);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setDetails(details.filter((_, i) => i !== index));
              }}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDetails([...details, { label: '', description: '' }])}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Detail
        </button>
      </div>

      {/* Main Product Images */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Main Product Images (Max 3)</h2>
          <button
            type="button"
            onClick={refreshImages}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            🔄 Refresh Images
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            💡 <strong>Need to upload new images?</strong> Go to{' '}
            <a 
              href="/admin/images" 
              target="_blank"
              className="font-medium underline hover:text-blue-800"
            >
              Image Management
            </a>{' '}
            to upload new product images, then come back and refresh this list.
          </p>
        </div>
        
        {/* Image Selection */}
        <div>
          <h3 className="text-lg font-medium mb-4">Select from Available Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Image Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleImageSelection(e.target.value, 'main');
                  }
                }}
                value=""
              >
                <option value="">Select an image...</option>
                {availableImages
                  .filter(img => !images.includes(img.url))
                  .map((image) => (
                    <option key={image.url} value={image.url}>
                      📁 {image.source === 'local' ? 'Local' : 'Cloud'} • {image.originalFilename ? image.originalFilename.replace(/[-_]/g, ' ') : getImageName(image.url)}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Selected Images Display */}
            {images.length > 0 ? (
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.map((imagePath) => {
                  const imageSource = availableImages.find(img => img.url === imagePath)?.source || 'unknown';
                  return (
                    <div key={imagePath} className="relative aspect-square rounded-lg overflow-hidden border-2 border-orange-500">
                      <Image
                        src={imagePath}
                        alt={getImageName(imagePath)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter(img => img !== imagePath))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getSourceBadgeColor(imageSource)}`}>
                          {imageSource === 'local' ? 'Local' : 'Cloud'}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 truncate">
                        {getImageName(imagePath)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="col-span-1 md:col-span-2 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                <p className="text-gray-500">No main images selected yet. Upload new images or select from existing ones.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Thumbnails */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Product Thumbnails (Max 5)</h2>
          <button
            type="button"
            onClick={refreshImages}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            🔄 Refresh Images
          </button>
        </div>
        
        {/* Image Selection */}
        <div>
          <h3 className="text-lg font-medium mb-4">Select from Available Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Image Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Thumbnail</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleImageSelection(e.target.value, 'thumbnail');
                  }
                }}
                value=""
              >
                <option value="">Select a thumbnail...</option>
                {availableImages
                  .filter(img => !thumbnails.includes(img.url))
                  .map((image) => (
                    <option key={image.url} value={image.url}>
                      📁 {image.source === 'local' ? 'Local' : 'Cloud'} • {image.originalFilename ? image.originalFilename.replace(/[-_]/g, ' ') : getImageName(image.url)}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Selected Images Display */}
            {thumbnails.length > 0 ? (
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {thumbnails.map((imagePath) => {
                  const imageSource = availableImages.find(img => img.url === imagePath)?.source || 'unknown';
                  return (
                    <div key={imagePath} className="relative aspect-square rounded-lg overflow-hidden border-2 border-orange-500">
                      <Image
                        src={imagePath}
                        alt={getImageName(imagePath)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      <button
                        type="button"
                        onClick={() => setThumbnails(thumbnails.filter(img => img !== imagePath))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getSourceBadgeColor(imageSource)}`}>
                          {imageSource === 'local' ? 'Local' : 'Cloud'}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 truncate">
                        {getImageName(imagePath)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="col-span-1 md:col-span-2 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                <p className="text-gray-500">No thumbnails selected yet. Upload new images or select from existing ones.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || quantityMismatch}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            initialData ? 'Update Product' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
}


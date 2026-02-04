'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category, Product, ProductVariant, ProductDetail } from "@prisma/client";
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { X, Plus, Loader2, Package, HardDrive } from 'lucide-react';

type ProductTypeOption = 'SIMPLE' | 'STORAGE';

interface SerializedProduct extends Omit<Product, 'price' | 'salePrice' | 'discountPrice' | 'sale' | 'stock' | 'createdAt' | 'updatedAt' | 'saleEndDate' | 'productType'> {
  price: string | null;
  salePrice: string | null;
  discountPrice: string | null;
  sale: string | null;
  stock: string;
  createdAt: string;
  updatedAt: string;
  saleEndDate: string | null;
  productType?: ProductTypeOption;
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

interface ProductDetailForm {
  label: string;
  description: string;
}

type TaxStatusOption = 'PAID' | 'UNPAID';
type TaxTypeOption = 'FIXED' | 'PERCENTAGE';

interface StorageUnit {
  id?: string;
  color: string;
  stock: number;
  taxStatus: TaxStatusOption;
  taxType: TaxTypeOption;
  taxAmount: string;
  taxPercentage: string;
}

interface ProductStorage {
  id?: string;
  size: string;
  price: string;
  salePercentage?: string;
  saleEndDate?: string;
  units: StorageUnit[];
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  // Infer product type: STORAGE if has storages, else SIMPLE
  const inferredType: ProductTypeOption = initialData?.productType || 
    (initialData?.storages && initialData.storages.length > 0 ? 'STORAGE' : 'SIMPLE');
  
  const [productType, setProductType] = useState<ProductTypeOption>(inferredType);
  const [loading, setLoading] = useState(false);
  const [availableImages, setAvailableImages] = useState<Array<{url: string, source: string, originalFilename?: string, publicId?: string}>>([]);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [thumbnails, setThumbnails] = useState<string[]>(initialData?.thumbnails || []);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(
    productType === 'SIMPLE' ? (initialData?.variants?.map(v => ({ color: v.color, quantity: v.quantity })) || []) : []
  );
  const [details, setDetails] = useState<ProductDetailForm[]>(
    initialData?.details?.map(d => ({ label: d.label, description: d.description })) || []
  );
  const [storages, setStorages] = useState<ProductStorage[]>(
    productType === 'STORAGE' ? (initialData?.storages?.map(s => {
      const st = s as { id?: string; size: string; price: string | number; salePercentage?: string | number; saleEndDate?: string; units?: StorageUnit[]; variants?: { color: string; quantity: number }[] };
      const units = st.units ?? st.variants?.map(v => ({
        color: v.color,
        stock: v.quantity,
        taxStatus: 'UNPAID' as TaxStatusOption,
        taxType: 'FIXED' as TaxTypeOption,
        taxAmount: '0',
        taxPercentage: ''
      })) ?? [];
      return {
        id: st.id,
        size: st.size,
        price: typeof st.price === 'number' ? st.price.toString() : (st.price ?? ''),
        salePercentage: st.salePercentage != null ? String(st.salePercentage) : "",
        saleEndDate: st.saleEndDate ? (typeof st.saleEndDate === 'string' ? st.saleEndDate.split('T')[0] : new Date(st.saleEndDate).toISOString().split('T')[0]) : "",
        units
      };
    }) || []) : []
  );
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    sale: initialData?.sale?.toString() || "",
    saleEndDate: initialData?.saleEndDate ? new Date(initialData.saleEndDate).toISOString().split('T')[0] : "",
    stock: initialData?.stock?.toString() || "",
    categoryId: initialData?.categoryId || "",
  });

  // Handle product type switch - clear irrelevant data
  const handleProductTypeChange = (type: ProductTypeOption) => {
    if (type === productType) return;
    setProductType(type);
    if (type === 'SIMPLE') {
      setStorages([]);
    } else {
      setColorVariants([]);
      setFormData(prev => ({ ...prev, price: "", stock: "", sale: "", saleEndDate: "" }));
    }
  };

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

  // Validate total quantity matches stock (SIMPLE only)
  const totalQuantity = colorVariants.reduce((sum, variant) => sum + variant.quantity, 0);
  const quantityMismatch = productType === 'SIMPLE' && colorVariants.length > 0 && totalQuantity !== Number(formData.stock);

  // Storage management functions
  const addStorage = () => {
    setStorages([...storages, {
      size: '',
      price: '',
      salePercentage: '',
      saleEndDate: '',
      units: []
    }]);
  };

  const removeStorage = (index: number) => {
    setStorages(storages.filter((_, i) => i !== index));
  };

  const updateStorage = (index: number, field: keyof ProductStorage, value: unknown) => {
    const newStorages = [...storages];
    newStorages[index] = { ...newStorages[index], [field]: value };
    setStorages(newStorages);
  };

  const addStorageUnit = (storageIndex: number) => {
    const newStorages = [...storages];
    newStorages[storageIndex].units.push({
      color: '',
      stock: 0,
      taxStatus: 'UNPAID',
      taxType: 'FIXED',
      taxAmount: '0',
      taxPercentage: ''
    });
    setStorages(newStorages);
  };

  const removeStorageUnit = (storageIndex: number, unitIndex: number) => {
    const newStorages = [...storages];
    newStorages[storageIndex].units = newStorages[storageIndex].units.filter((_, i) => i !== unitIndex);
    setStorages(newStorages);
  };

  const updateStorageUnit = (storageIndex: number, unitIndex: number, field: keyof StorageUnit, value: unknown) => {
    const newStorages = [...storages];
    newStorages[storageIndex].units[unitIndex] = {
      ...newStorages[storageIndex].units[unitIndex],
      [field]: value
    };
    setStorages(newStorages);
  };

  // Sale applies to base price only, not taxes
  const getStorageSalePrice = (storage: ProductStorage): number | null => {
    if (storage.price && storage.salePercentage) {
      const price = parseFloat(storage.price);
      const salePercentage = parseFloat(storage.salePercentage);
      return price - (price * (salePercentage / 100));
    }
    return null;
  };

  // Calculated price per unit: salePrice + tax (only for PAID - seller paid duties, reflected in price). UNPAID = no tax added.
  const getUnitCalculatedPrice = (storage: ProductStorage, unit: StorageUnit): number | null => {
    const basePrice = parseFloat(storage.price || '0');
    const salePrice = getStorageSalePrice(storage) ?? basePrice;
    if (unit.taxStatus === 'UNPAID') return salePrice;
    // PAID: add tax/fees (duties seller paid, included in final price)
    if (unit.taxType === 'FIXED') {
      const tax = parseFloat(unit.taxAmount || '0');
      return salePrice + tax;
    }
    const pct = parseFloat(unit.taxPercentage || '0');
    return salePrice + (salePrice * pct / 100);
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
    
    if (productType === 'SIMPLE') {
      if (quantityMismatch) {
        toast.error(`Total color quantities (${totalQuantity}) must match stock (${formData.stock})`);
        return;
      }
      if (!formData.price || !formData.stock) {
        toast.error("Price and stock are required for simple products");
        return;
      }
    } else {
      if (storages.length === 0) {
        toast.error("Add at least one storage option for multi-storage products");
        return;
      }
      const invalidStorage = storages.find(s => !s.size || !s.price);
      if (invalidStorage) {
        toast.error("Each storage option must have size and base price");
        return;
      }
      const storageWithoutUnits = storages.find(s => !s.units?.length);
      if (storageWithoutUnits) {
        toast.error("Each storage must have at least one unit (color + stock + tax)");
        return;
      }
      for (const s of storages) {
        const badUnit = s.units.find(u => !u.color || u.stock < 0 || (u.taxStatus === 'PAID' && u.taxType === 'FIXED' && (u.taxAmount === '' || parseFloat(u.taxAmount) < 0)) || (u.taxStatus === 'PAID' && u.taxType === 'PERCENTAGE' && (u.taxPercentage === '' || parseFloat(u.taxPercentage) < 0)));
        if (badUnit) {
          toast.error("Each unit must have color, stock ≥ 0, and valid tax (when PAID)");
          return;
        }
      }
    }

    // Validate sale end date is not in the past (SIMPLE only)
    if (productType === 'SIMPLE' && formData.sale && formData.saleEndDate) {
      const endDate = new Date(formData.saleEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) {
        toast.error("Sale end date cannot be in the past");
        return;
      }
    } else if (productType === 'SIMPLE' && formData.sale && !formData.saleEndDate) {
      toast.error("Sale end date is required when setting a sale percentage");
      return;
    }

    setLoading(true);

    try {
      const url = initialData 
        ? `/api/products/${initialData.id}`
        : '/api/products';
        
      const productData = {
        ...formData,
        productType,
        price: productType === 'SIMPLE' ? parseFloat(formData.price) : null,
        stock: productType === 'SIMPLE' ? parseInt(formData.stock) : null,
        sale: productType === 'SIMPLE' && formData.sale ? parseFloat(formData.sale) : null,
        salePrice: productType === 'SIMPLE' ? salePrice : null,
        saleEndDate: productType === 'SIMPLE' && formData.saleEndDate ? formData.saleEndDate : null,
        images,
        thumbnails,
        details,
        variants: productType === 'SIMPLE' ? colorVariants : [],
        storages: productType === 'STORAGE' ? storages.map(storage => ({
          id: storage.id,
          size: storage.size,
          price: parseFloat(storage.price),
          salePercentage: storage.salePercentage ? parseFloat(storage.salePercentage) : null,
          saleEndDate: storage.saleEndDate || null,
          units: storage.units.map(u => ({
            id: u.id,
            color: u.color,
            stock: u.stock,
            taxStatus: u.taxStatus,
            taxType: u.taxType,
            taxAmount: u.taxType === 'FIXED' && u.taxAmount ? parseFloat(u.taxAmount) : null,
            taxPercentage: u.taxType === 'PERCENTAGE' && u.taxPercentage ? parseFloat(u.taxPercentage) : null
          }))
        })) : []
      };

      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { ...csrfHeaders, 'Content-Type': 'application/json' },
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
      {/* Product Type Selector - First thing admin sees */}
      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Type</h2>
        <p className="text-sm text-gray-600 mb-4">Choose how this product will be sold. You cannot change this after adding storage options.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleProductTypeChange('SIMPLE')}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              productType === 'SIMPLE' 
                ? 'border-orange-500 bg-orange-50 shadow-md' 
                : 'border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            <div className={`p-3 rounded-lg ${productType === 'SIMPLE' ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <Package className={`h-8 w-8 ${productType === 'SIMPLE' ? 'text-orange-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Simple Product</h3>
              <p className="text-sm text-gray-600 mt-1">Single price, optional colors. Best for: accessories, cases, chargers.</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleProductTypeChange('STORAGE')}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              productType === 'STORAGE' 
                ? 'border-orange-500 bg-orange-50 shadow-md' 
                : 'border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            <div className={`p-3 rounded-lg ${productType === 'STORAGE' ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <HardDrive className={`h-8 w-8 ${productType === 'STORAGE' ? 'text-orange-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Multi-Storage Product</h3>
              <p className="text-sm text-gray-600 mt-1">Multiple storage options with different prices. Best for: phones, tablets, laptops.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Basic Info - Always shown */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  📂 {category.name} → /categories/{category.slug}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SIMPLE: Price, Stock & Sale */}
      {productType === 'SIMPLE' && (
      <div className="border border-gray-200 rounded-xl p-6 bg-blue-50/30">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (EGP)</label>
            <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" required min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Sale (Optional)</h3>
            {(formData.sale || formData.saleEndDate) && (
              <button type="button" onClick={() => setFormData({ ...formData, sale: "", saleEndDate: "" })} className="text-sm text-red-600 hover:text-red-800">Clear Sale</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-gray-600">EGP {calculateNewPrice(Number(formData.price), Number(formData.sale)).toFixed(2)}</div>
            </div>
          )}
          </div>
        </div>
      </div>
      )}

      {/* SIMPLE: Color Variants */}
      {productType === 'SIMPLE' && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Color Variants
          </h2>
          {quantityMismatch && (
            <p className="text-sm text-red-600">Total quantities ({totalQuantity}) must match stock ({formData.stock})</p>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">Add colors if product comes in multiple colors.</p>
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
      )}

      {/* STORAGE: Storage Options */}
      {productType === 'STORAGE' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Storage Options (Optional)</h2>
          <p className="text-sm text-gray-600">Define different storage variants with their own pricing and colors</p>
        </div>

        {storages.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Units:</strong> Each storage has units with color, stock, and tax. Total stock = sum of units. Sale applies to base price only (not taxes). PAID = seller paid duties → add tax/fees to price; UNPAID = no tax added.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (EGP)</label>
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
            </div>

            {/* Sale Information (applies to base price only, not taxes) */}
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
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="ml-2 font-medium">EGP {parseFloat(storage.price || '0').toFixed(2)}</span>
                  </div>
                  {storage.salePercentage && (
                    <div>
                      <span className="text-sm text-gray-600">Sale Price (before tax):</span>
                      <span className="ml-2 font-medium text-green-600">
                        EGP {getStorageSalePrice(storage)?.toFixed(2)}
                      </span>
                      <span className="ml-2 text-sm text-green-600">
                        ({storage.salePercentage}% off)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Units: color + stock + tax + calculated price */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Units for {storage.size || 'this storage'}</h4>
                <div className="text-sm text-gray-600">
                  Total stock: {storage.units.reduce((sum, u) => sum + u.stock, 0)}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Color</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Stock</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Tax Status</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Tax Type</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Tax Amount / %</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Calculated Price</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {storage.units.map((unit, unitIndex) => (
                      <tr key={unitIndex} className="border-t border-gray-200">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="e.g. Black"
                            value={unit.color}
                            onChange={(e) => updateStorageUnit(storageIndex, unitIndex, 'color', e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={unit.stock}
                            onChange={(e) => updateStorageUnit(storageIndex, unitIndex, 'stock', parseInt(e.target.value) || 0)}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={unit.taxStatus}
                            onChange={(e) => updateStorageUnit(storageIndex, unitIndex, 'taxStatus', e.target.value as TaxStatusOption)}
                            className="rounded border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="PAID">Paid</option>
                            <option value="UNPAID">Unpaid</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={unit.taxType}
                            onChange={(e) => updateStorageUnit(storageIndex, unitIndex, 'taxType', e.target.value as TaxTypeOption)}
                            className="rounded border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="FIXED">Fixed</option>
                            <option value="PERCENTAGE">Percentage</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {unit.taxType === 'FIXED' ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={unit.taxAmount}
                              onChange={(e) => updateStorageUnit(storageIndex, unitIndex, 'taxAmount', e.target.value)}
                              className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={unit.taxPercentage}
                              onChange={(e) => updateStorageUnit(storageIndex, unitIndex, 'taxPercentage', e.target.value)}
                              className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-700">
                          {getUnitCalculatedPrice(storage, unit) != null ? `EGP ${getUnitCalculatedPrice(storage, unit)!.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeStorageUnit(storageIndex, unitIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => addStorageUnit(storageIndex)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-3 w-3" />
                Add Unit
              </button>
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
      )}

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


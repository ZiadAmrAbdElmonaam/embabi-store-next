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


export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [thumbnails, setThumbnails] = useState<string[]>(initialData?.thumbnails || []);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(
    initialData?.variants.map(v => ({ color: v.color, quantity: v.quantity })) || []
  );
  const [details, setDetails] = useState<ProductDetail[]>(
    initialData?.details.map(d => ({ label: d.label, description: d.description })) || []
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
    // Fetch available images from the API
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

  // Function to get image name from path
  const getImageName = (imagePath: string) => {
    const parts = imagePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.split('.')[0].replace(/[-_]/g, ' ');
  };

  // Calculate sale price
  const salePrice = formData.price && formData.sale 
    ? Number(formData.price) - (Number(formData.price) * (Number(formData.sale) / 100))
    : null;

  // Validate total quantity matches stock
  const totalQuantity = colorVariants.reduce((sum, variant) => sum + variant.quantity, 0);
  const quantityMismatch = totalQuantity !== Number(formData.stock);

  // Calculate new price based on sale percentage
  const calculateNewPrice = (price: number, salePercentage: number) => {
    return price - (price * (salePercentage / 100));
  };

  // Check if sale is expired and clear it if needed
  useEffect(() => {
    if (formData.saleEndDate) {
      const endDate = new Date(formData.saleEndDate);
      const today = new Date();
      
      // Log dates with full date-time details
      console.log('Sale End Date:', endDate.toISOString());
      console.log('Today:', today.toISOString());
      console.log('Is sale expired?', endDate < today);
      console.log('Timestamp comparison:', endDate.getTime(), '<', today.getTime(), '=', endDate.getTime() < today.getTime());
      
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
      toast.error(`Total color quantities (${totalQuantity}) must match stock (${formData.stock})`);
      return;
    }

    // Validate sale end date is not in the past
    if (formData.sale && formData.saleEndDate) {
      const endDate = new Date(formData.saleEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
      
      console.log('Form Submission - Sale End Date:', endDate.toISOString());
      console.log('Form Submission - Today (start of day):', today.toISOString());
      console.log('Form Submission - Is sale expired?', endDate < today);
      console.log('Form Submission - Timestamp comparison:', endDate.getTime(), '<', today.getTime(), '=', endDate.getTime() < today.getTime());
      
      if (endDate < today) {
        console.error('Sale end date validation failed - date is in the past');
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
        variants: colorVariants
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
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <input
            type="number"
            required
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
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
          <h2 className="text-xl font-semibold">Color Variants</h2>
          {quantityMismatch && (
            <p className="text-sm text-red-600">
              Total quantities ({totalQuantity}) must match stock ({formData.stock})
            </p>
          )}
        </div>
        
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Main Product Images (Max 3)</h2>
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
                .filter(img => !images.includes(img))
                .map((imagePath) => (
                  <option key={imagePath} value={imagePath}>
                    {getImageName(imagePath)}
                  </option>
                ))}
            </select>
          </div>
          
          {/* Selected Images Display */}
          {images.length > 0 ? (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              {images.map((imagePath) => (
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
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 truncate">
                    {getImageName(imagePath)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              <p className="text-gray-500">No main images selected yet. Please select up to 3 images.</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Thumbnails */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Product Thumbnails (Max 5)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Thumbnail Selection Dropdown */}
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
                .filter(img => !thumbnails.includes(img))
                .map((imagePath) => (
                  <option key={imagePath} value={imagePath}>
                    {getImageName(imagePath)}
                  </option>
                ))}
            </select>
          </div>
          
          {/* Selected Thumbnails Display */}
          {thumbnails.length > 0 ? (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              {thumbnails.map((imagePath) => (
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
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 truncate">
                    {getImageName(imagePath)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              <p className="text-gray-500">No thumbnails selected yet. Please select up to 5 thumbnails.</p>
            </div>
          )}
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


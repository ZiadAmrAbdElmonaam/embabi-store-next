'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product, ProductVariant } from "@prisma/client";
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { X, Image as ImageIcon, Plus } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface ProductFormProps {
  categories: Category[];
  initialData?: Product & {
    variants: ProductVariant[];
    details: ProductDetail[];
  };
}

interface ColorVariant {
  color: string;
  quantity: number;
}

interface ProductDetail {
  label: string;
  description: string;
}

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [thumbnails, setThumbnails] = useState<string[]>(initialData?.thumbnails || []);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(initialData?.variants || []);
  const [details, setDetails] = useState<ProductDetail[]>(initialData?.details || []);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    sale: initialData?.sale || "",
    saleEndDate: initialData?.saleEndDate ? new Date(initialData.saleEndDate).toISOString().split('T')[0] : "",
    stock: initialData?.stock || "",
    categoryId: initialData?.categoryId || "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityMismatch) {
      toast.error("Total color quantities must match stock amount");
      return;
    }

    setLoading(true);

    try {
      const url = initialData 
        ? `/api/products/${initialData.id}`
        : '/api/products';
        
      const response = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salePrice,
          images,
          thumbnails,
          details,
          variants: colorVariants,
        }),
      });

      if (!response.ok) throw new Error('Failed to save product');

      router.push('/admin/products');
      router.refresh();
      toast.success(initialData ? 'Product updated' : 'Product created');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'image' | 'thumbnail') => {
    const maxFiles = type === 'image' ? 3 : 5;
    const currentFiles = type === 'image' ? images : thumbnails;

    if (currentFiles.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} ${type}s allowed`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      if (type === 'image') {
        setImages([...images, data.secure_url]);
      } else {
        setThumbnails([...thumbnails, data.secure_url]);
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          defaultValue={initialData?.name}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={initialData?.description}
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
            name="price"
            defaultValue={initialData?.price.toString()}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <input
            type="number"
            name="stock"
            defaultValue={initialData?.stock}
            required
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          name="categoryId"
          defaultValue={initialData?.categoryId}
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
        <h2 className="text-xl font-semibold">Pricing and Stock</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price.toString()}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700">New Price</label>
            <div className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500">
              {formData.price && formData.sale ? 
                `$${calculateNewPrice(Number(formData.price), Number(formData.sale)).toFixed(2)}` 
                : '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sale End Date</label>
            <input
              type="date"
              value={formData.saleEndDate}
              onChange={(e) => setFormData({ ...formData, saleEndDate: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Color Variants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color Variants</h2>
        
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

        {quantityMismatch && (
          <p className="text-sm text-red-600">
            Total color quantities ({totalQuantity}) must match stock amount ({formData.stock})
          </p>
        )}
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

      {/* Main Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Main Product Images</h2>
          <span className="text-sm text-gray-500">
            {images.length}/3 images
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, i) => i !== index))}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {images.length < 3 && (
            <ImageUploadBox
              onUpload={(file) => handleImageUpload(file, 'image')}
              text="Add Main Image"
            />
          )}
        </div>

        {images.length === 0 && (
          <p className="text-sm text-red-500">
            At least one main image is required
          </p>
        )}
      </div>

      {/* Thumbnails */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Product Thumbnails</h2>
          <span className="text-sm text-gray-500">
            {thumbnails.length}/5 thumbnails
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {thumbnails.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setThumbnails(thumbnails.filter((_, i) => i !== index))}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {thumbnails.length < 5 && (
            <ImageUploadBox
              onUpload={(file) => handleImageUpload(file, 'thumbnail')}
              text="Add Thumbnail"
            />
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
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            initialData ? 'Update Product' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
}

// Helper component for image upload box
function ImageUploadBox({ onUpload, text }: { onUpload: (file: File) => void, text: string }) {
  return (
    <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <ImageIcon className="h-8 w-8 text-gray-400" />
      <span className="mt-2 text-sm text-gray-500">{text}</span>
      <span className="mt-1 text-xs text-gray-400">Max 5MB</span>
    </label>
  );
} 
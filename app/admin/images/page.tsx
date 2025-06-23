'use client';

import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/admin/image-upload';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ImageItem {
  url: string;
  source: 'local' | 'cloudinary';
}

export default function ImageManagementPage() {
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [categoryImages, setCategoryImages] = useState<ImageItem[]>([]);
  const [carouselImages, setCarouselImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all image types in parallel
      const [productsRes, categoriesRes, carouselRes] = await Promise.all([
        fetch('/api/images/products'),
        fetch('/api/images/categories'),
        fetch('/api/images/carousel')
      ]);

      if (productsRes.ok) {
        const products = await productsRes.json();
        setProductImages(products);
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        setCategoryImages(categories);
      }

      if (carouselRes.ok) {
        const carousel = await carouselRes.json();
        setCarouselImages(carousel);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const refreshImages = () => {
    fetchImages();
    toast.success('Images refreshed');
  };

  const handleImagesUploaded = (images: any[]) => {
    console.log('Uploaded images:', images);
    toast.success(`${images.length} image(s) uploaded successfully`);
    // Refresh images after upload
    setTimeout(fetchImages, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Image Management</h1>
        <p className="text-gray-600 mt-2">
          Upload images for products, categories, and carousel. These images will be available 
          when creating or editing products and categories.
        </p>
      </div>

      {/* Recommended Image Sizes */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📏 Recommended Image Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Product Sizes */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-blue-900">Products</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Main Images:</span>
                <span className="font-medium text-blue-700">800×800px</span>
              </div>
              <p className="text-xs text-gray-500">Square format - Perfect for product grids</p>
              <div className="flex justify-between">
                <span className="text-gray-600">Thumbnails:</span>
                <span className="font-medium text-blue-700">400×400px</span>
              </div>
              <p className="text-xs text-gray-500">Square format - Smaller product views</p>
            </div>
          </div>

          {/* Category Sizes */}
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-green-900">Categories</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Category Images:</span>
                <span className="font-medium text-green-700">400×300px</span>
              </div>
              <p className="text-xs text-gray-500">4:3 ratio - Good for category cards</p>
            </div>
          </div>

          {/* Carousel Sizes */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-purple-900">Carousel</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Banner Images:</span>
                <span className="font-medium text-purple-700">1200×400px</span>
              </div>
              <p className="text-xs text-gray-500">3:1 ratio - Wide hero banners</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Images will be automatically optimized and compressed when uploaded. 
            These are recommended sizes for best visual quality on your website.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold">Product Images</h2>
          </div>
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Best sizes:</strong> 800×800px (main), 400×400px (thumbnails)
            </p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Upload images for products. These will appear in the product creation form.
          </p>
          <ImageUpload 
            folder="products"
            onImagesUploaded={handleImagesUploaded}
            maxFiles={10}
          />
          
          {/* Display existing product images */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Existing Product Images ({productImages.length})</h3>
              <button
                onClick={refreshImages}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                🔄 Refresh
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : productImages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No product images found</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {productImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="absolute top-1 right-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        image.source === 'cloudinary' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {image.source === 'cloudinary' ? 'Cloud' : 'Local'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold">Category Images</h2>
          </div>
          <div className="mb-4 p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-700">
              <strong>Best size:</strong> 400×300px (4:3 ratio)
            </p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Upload images for categories. These will appear in the category creation form.
          </p>
          <ImageUpload 
            folder="categories"
            onImagesUploaded={handleImagesUploaded}
            maxFiles={10}
          />
          
          {/* Display existing category images */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Existing Category Images ({categoryImages.length})</h3>
              <button
                onClick={refreshImages}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                🔄 Refresh
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : categoryImages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No category images found</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`Category image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="absolute top-1 right-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        image.source === 'cloudinary' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {image.source === 'cloudinary' ? 'Cloud' : 'Local'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carousel Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold">Carousel Images</h2>
          </div>
          <div className="mb-4 p-3 bg-purple-50 rounded-md">
            <p className="text-sm text-purple-700">
              <strong>Best size:</strong> 1200×400px (3:1 ratio)
            </p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Upload images for the homepage carousel. These will appear in the carousel management.
          </p>
          <ImageUpload 
            folder="carousel"
            onImagesUploaded={handleImagesUploaded}
            maxFiles={10}
          />
          
          {/* Display existing carousel images */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Existing Carousel Images ({carouselImages.length})</h3>
              <button
                onClick={refreshImages}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                🔄 Refresh
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : carouselImages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No carousel images found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {carouselImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full aspect-[3/1] bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`Carousel image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="absolute top-1 right-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        image.source === 'cloudinary' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {image.source === 'cloudinary' ? 'Cloud' : 'Local'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Upload images here first using the recommended sizes above</li>
                <li>Then go to Products/Categories to create items</li>
                <li>Select from uploaded images in the dropdown</li>
                <li>Images are automatically optimized and stored in the cloud</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface CategoryFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string | null;
    image?: string | null;
  };
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableImages, setAvailableImages] = useState<Array<{url: string, source: string}>>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    image: initialData?.image || "",
  });

  useEffect(() => {
    // Fetch available images from the API (now includes both local and Cloudinary)
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images/categories');
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

  // Function to get image name from path (works for both local and Cloudinary URLs)
  const getImageName = (imagePath: string) => {
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
      const response = await fetch('/api/images/categories');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id 
        ? `/api/categories/${initialData.id}`
        : '/api/categories';
        
      const response = await fetch(url, {
        method: initialData?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save category');

      router.push('/admin/categories');
      router.refresh();
      toast.success(initialData ? 'Category updated' : 'Category created');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        image: initialData.image || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
      });
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
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Category Image */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category Image</h3>
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
            to upload new category images, then come back and refresh this list.
          </p>
        </div>

        {/* Image Selection */}
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium mb-2">Select from Available Images</h4>
            <label className="block text-sm font-medium text-gray-700">Select Image</label>
            <select
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select an image...</option>
              {availableImages.map((image) => (
                <option key={image.url} value={image.url}>
                  📁 {image.source === 'local' ? 'Local' : 'Cloud'} • {getImageName(image.url)}
                </option>
              ))}
            </select>
          </div>

          {formData.image && (
            <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden border-2 border-orange-500">
              <Image
                src={formData.image}
                alt="Selected category image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 192px"
              />
              <div className="absolute top-2 left-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getSourceBadgeColor(
                  availableImages.find(img => img.url === formData.image)?.source || 'unknown'
                )}`}>
                  {availableImages.find(img => img.url === formData.image)?.source === 'local' ? 'Local' : 'Cloud'}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 truncate">
                {getImageName(formData.image)}
              </div>
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
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            initialData ? 'Update Category' : 'Create Category'
          )}
        </button>
      </div>
    </form>
  );
} 
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Loader2, Lightbulb, Check } from "lucide-react";
import { getCategoryNameSuggestions, generateSlugPreview, isNameDescriptive, CategorySuggestion } from "@/lib/category-suggestions";

interface CategoryFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string | null;
    image?: string | null;
    parentId?: string | null;
    brand?: string | null;
  };
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableImages, setAvailableImages] = useState<Array<{url: string, source: string, originalFilename?: string, publicId?: string}>>([]);
  const [parentCategories, setParentCategories] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedParentName, setSelectedParentName] = useState("");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    image: initialData?.image || "",
    parentId: initialData?.parentId || "",
    brand: initialData?.brand || "",
  });

  useEffect(() => {
    // Fetch available images from the API (now includes both local and Cloudinary)
    const fetchImages = async () => {
      try {
        // Add cache busting parameter to ensure fresh data
        const response = await fetch(`/api/images/categories?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch images');
        const images = await response.json();
        setAvailableImages(images);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to load available images');
      }
    };

    // Fetch parent categories (only categories that can be parents)
    const fetchParentCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();
        
        // Filter to get potential parent categories (excluding current category if editing)
        const potentialParents = categories.filter((cat: any) => 
          cat.id !== initialData?.id && // Can't be parent of itself
          !cat.parentId // Only categories without parents can be parents (no grandparents)
        );
        
        setParentCategories(potentialParents);
      } catch (error) {
        console.error('Error fetching parent categories:', error);
        toast.error('Failed to load parent categories');
      }
    };

    fetchImages();
    fetchParentCategories();
  }, [initialData?.id]);

  // Generate suggestions when name or parent changes
  useEffect(() => {
    if (formData.name.trim() && selectedParentName.trim()) {
      const newSuggestions = getCategoryNameSuggestions(formData.name, selectedParentName);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 1); // Show if there are suggestions beyond original name
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.name, selectedParentName]);

  // Update selected parent name when parentId changes
  useEffect(() => {
    if (formData.parentId) {
      const selectedParent = parentCategories.find(cat => cat.id === formData.parentId);
      setSelectedParentName(selectedParent?.name || "");
    } else {
      setSelectedParentName("");
    }
  }, [formData.parentId, parentCategories]);

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

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: CategorySuggestion) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name
    }));
    setShowSuggestions(false);
    toast.success(`Selected: "${suggestion.name}"`);
  };

  // Refresh available images
  const refreshImages = async () => {
    try {
      // Add cache busting parameter to ensure fresh data
      const response = await fetch(`/api/images/categories?t=${Date.now()}`);
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
        parentId: initialData.parentId || "",
        brand: initialData.brand || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
        parentId: "",
        brand: "",
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
        
        {/* Smart Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Smart Suggestions for "{selectedParentName}"
              </span>
            </div>
            
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full text-left p-3 rounded-md border-2 transition-all hover:border-blue-300 hover:bg-blue-100 ${
                    formData.name === suggestion.name 
                      ? 'border-blue-500 bg-blue-100' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{suggestion.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.description}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          URL: /categories/{generateSlugPreview(suggestion.name, selectedParentName)}
                        </div>
                      </div>
                    </div>
                    {formData.name === suggestion.name && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                💡 Tip: Choose a descriptive name to help customers find exactly what they're looking for!
              </p>
            </div>
          </div>
        )}
        
        {/* Slug Preview */}
        {formData.name && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              URL Preview: <code className="bg-gray-100 px-1 rounded">/categories/{generateSlugPreview(formData.name, selectedParentName)}</code>
              {selectedParentName && (
                <span className="ml-2 text-blue-600">✨ Auto-combined with parent</span>
              )}
            </p>
          </div>
        )}
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

      <div>
        <label className="block text-sm font-medium text-gray-700">Parent Category</label>
        <select
          value={formData.parentId}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">No Parent (This will be a main category)</option>
          {parentCategories.map((category) => (
            <option key={category.id} value={category.id}>
              📁 {category.name} → /categories/{category.slug}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Select a parent category to make this a subcategory, or leave empty to create a main category.
        </p>
        {formData.parentId && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              💡 <strong>Auto-Slug Generation:</strong> Your category URL will be automatically combined as: 
              <code className="bg-blue-100 px-1 rounded ml-1">
                /categories/{formData.name ? generateSlugPreview(formData.name, selectedParentName) : 'your-name-' + selectedParentName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
              </code>
            </p>
          </div>
        )}
      </div>

      {/* Brand Field - Only show for subcategories */}
      {formData.parentId && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <select
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">No Brand (Generic Category)</option>
            <option value="Apple">🍎 Apple</option>
            <option value="Samsung">📱 Samsung</option>
            <option value="OnePlus">➕ OnePlus</option>
            <option value="Sony">🎵 Sony</option>
            <option value="Garmin">⌚ Garmin</option>
            <option value="Dell">💻 Dell</option>
            <option value="HP">🖥️ HP</option>
            <option value="Microsoft">🖱️ Microsoft</option>
            <option value="Google">🔍 Google</option>
            <option value="Xiaomi">📲 Xiaomi</option>
            <option value="Huawei">📡 Huawei</option>
            <option value="LG">📺 LG</option>
            <option value="Asus">⚡ Asus</option>
            <option value="Lenovo">💼 Lenovo</option>
            <option value="Acer">🎮 Acer</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Select a brand for this subcategory. This will group it with other products from the same brand.
          </p>
          {formData.brand && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-700">
                ✅ This category will appear under "<strong>{formData.brand}</strong>" in the "Shop by Brands" section.
              </p>
            </div>
          )}
        </div>
      )}

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
                  📁 {image.source === 'local' ? 'Local' : 'Cloud'} • {image.originalFilename ? image.originalFilename.replace(/[-_]/g, ' ') : getImageName(image.url)}
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
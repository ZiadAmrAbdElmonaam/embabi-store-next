'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, ImagePlus, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { InstructionDialog } from '@/components/admin/instruction-dialog';

interface CarouselImage {
  id: string;
  url: string;
  order: number;
  linkUrl?: string | null;
}

export default function CarouselManagementPage() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newImageLink, setNewImageLink] = useState('');
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);

  // Hero thumbnails (4 static images for the right side)
  const [heroThumbnails, setHeroThumbnails] = useState<Array<{ id?: string; order: number; url: string; linkUrl?: string | null }>>([
    { order: 1, url: '', linkUrl: null },
    { order: 2, url: '', linkUrl: null },
    { order: 3, url: '', linkUrl: null },
    { order: 4, url: '', linkUrl: null },
  ]);
  const [savingThumbnails, setSavingThumbnails] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        
        // Fetch current carousel images
        const imagesResponse = await fetch('/api/admin/carousel');
        if (!imagesResponse.ok) throw new Error('Failed to fetch carousel images');
        const carouselData = await imagesResponse.json();
        
        // Ensure images array exists even if API returns incomplete data
        const imagesData = carouselData.images || [];
        setImages(imagesData);
        setLinkInputs(
          imagesData.reduce((acc: Record<string, string>, image: CarouselImage) => {
            acc[image.id] = image.linkUrl || '';
            return acc;
          }, {})
        );
        
        // Fetch available images from both local and Cloudinary
        const availableResponse = await fetch('/api/images/carousel');
        if (!availableResponse.ok) throw new Error('Failed to fetch available images');
        const availableData = await availableResponse.json();
        // Extract URLs from the {url, source, originalFilename} format
        const imageUrls = availableData.map((img: any) => img.url);
        setAvailableImages(imageUrls || []);

        // Fetch hero thumbnails
        const thumbRes = await fetch('/api/admin/hero-thumbnails');
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          const thumbs = thumbData.thumbnails || [];
          setHeroThumbnails([
            { order: 1, url: thumbs.find((t: any) => t.order === 1)?.url || '', linkUrl: thumbs.find((t: any) => t.order === 1)?.linkUrl || null },
            { order: 2, url: thumbs.find((t: any) => t.order === 2)?.url || '', linkUrl: thumbs.find((t: any) => t.order === 2)?.linkUrl || null },
            { order: 3, url: thumbs.find((t: any) => t.order === 3)?.url || '', linkUrl: thumbs.find((t: any) => t.order === 3)?.linkUrl || null },
            { order: 4, url: thumbs.find((t: any) => t.order === 4)?.url || '', linkUrl: thumbs.find((t: any) => t.order === 4)?.linkUrl || null },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch carousel data:', error);
        toast.error('Failed to load carousel data');
        // Set empty arrays to prevent undefined errors
        setImages([]);
        setLinkInputs({});
        setAvailableImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleAddImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/admin/carousel', {
        method: 'POST',
        headers: {
          ...csrfHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: selectedImage,
          order: images.length + 1, // Add to the end
          linkUrl: newImageLink.trim() || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to add image');
      
      const result = await response.json();
      setImages([...images, result.image]);
      setLinkInputs((prev) => ({
        ...prev,
        [result.image.id]: result.image.linkUrl || '',
      }));
      setSelectedImage(null);
      setNewImageLink('');
      toast.success('Image added to carousel');
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image to carousel');
    }
  };

  const handleRemoveImage = async (id: string) => {
    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const headers = await getCsrfHeaders();
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to remove image');
      
      // Remove from local state
      setImages(images.filter(img => img.id !== id));
      setLinkInputs((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      toast.success('Image removed from carousel');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image from carousel');
    }
  };

  const handleLinkInputChange = (id: string, value: string) => {
    setLinkInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSaveLink = async (id: string) => {
    const linkValue = linkInputs[id]?.trim() || '';

    try {
      setSavingLinkId(id);
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: 'PATCH',
        headers: {
          ...csrfHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkUrl: linkValue || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update link');

      const result = await response.json();

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, linkUrl: result.image.linkUrl } : img
        )
      );
      setLinkInputs((prev) => ({
        ...prev,
        [id]: result.image.linkUrl || '',
      }));

      toast.success('Link saved');
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link');
    } finally {
      setSavingLinkId(null);
    }
  };

  const handleReorderImage = async (id: string, direction: 'up' | 'down') => {
    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/carousel/reorder`, {
        method: 'PUT',
        headers: {
          ...csrfHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          direction,
        }),
      });

      if (!response.ok) throw new Error('Failed to reorder images');
      
      const result = await response.json();
      
      // Update local state with the new order from the server
      setImages(result.images);
      setLinkInputs(
        result.images.reduce((acc: Record<string, string>, image: CarouselImage) => {
          acc[image.id] = image.linkUrl || '';
          return acc;
        }, {})
      );
      
      toast.success('Carousel order updated');
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder carousel images');
    }
  };

  const setHeroThumbnailSlot = (order: number, url: string, linkUrl?: string | null) => {
    setHeroThumbnails((prev) =>
      prev.map((t) => (t.order === order ? { ...t, url, linkUrl: linkUrl ?? t.linkUrl } : t))
    );
  };

  const setHeroThumbnailLink = (order: number, linkUrl: string) => {
    setHeroThumbnails((prev) =>
      prev.map((t) => (t.order === order ? { ...t, linkUrl: linkUrl || null } : t))
    );
  };

  const handleSaveHeroThumbnails = async () => {
    try {
      setSavingThumbnails(true);
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/admin/hero-thumbnails', {
        method: 'PUT',
        headers: { ...csrfHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thumbnails: heroThumbnails.map((t) => ({ order: t.order, url: t.url, linkUrl: t.linkUrl || null })),
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success('Hero thumbnails saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save hero thumbnails');
    } finally {
      setSavingThumbnails(false);
    }
  };

  const refreshImages = async () => {
    try {
      setIsLoading(true);
      
      // Fetch current carousel images
      const imagesResponse = await fetch('/api/admin/carousel');
      if (!imagesResponse.ok) throw new Error('Failed to fetch carousel images');
      const carouselData = await imagesResponse.json();
      
      // Ensure images array exists even if API returns incomplete data
      const imagesData = carouselData.images || [];
      setImages(imagesData);
      setLinkInputs(
        imagesData.reduce((acc: Record<string, string>, image: CarouselImage) => {
          acc[image.id] = image.linkUrl || '';
          return acc;
        }, {})
      );
      
      // Fetch available images from both local and Cloudinary
      const availableResponse = await fetch('/api/images/carousel');
      if (!availableResponse.ok) throw new Error('Failed to fetch available images');
      const availableData = await availableResponse.json();
              // Extract URLs from the {url, source, originalFilename} format  
        const imageUrls = availableData.map((img: any) => img.url);
        setAvailableImages(imageUrls || []);
      
      toast.success('Images refreshed');
    } catch (error) {
      console.error('Failed to refresh carousel data:', error);
      toast.error('Failed to refresh carousel data');
      // Set empty arrays to prevent undefined errors
      setImages([]);
      setAvailableImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const carouselInstructions = [
    {
      step: 1,
      title: 'Upload Images',
      description: 'First, upload carousel images to your image library.',
      details: [
        'Click "Upload New" or go to Image Management',
        'Upload images to the "carousel" folder',
        'Recommended size: 1920x800px for main carousel, 800x600px for thumbnails',
        'Use .jpg or .png format',
      ],
    },
    {
      step: 2,
      title: 'Set Hero Thumbnails (4 Static Images)',
      description: 'Configure the 4 static images that appear beside the main carousel.',
      details: [
        'These appear on the right side (50% width) on desktop, below on mobile',
        'Click on slot 1, 2, 3, or 4 in the Hero Thumbnails section',
        'Select an image from the previews or available images grid',
        'Optionally add a link URL (e.g., /products/iphone)',
        'Click "Save Hero Thumbnails" when done',
      ],
    },
    {
      step: 3,
      title: 'Add Images to Main Carousel',
      description: 'Add sliding images to the main carousel.',
      details: [
        'Scroll to "Available Images" section',
        'Click on an image to select it',
        'Optionally add a link URL (where "Buy Now" button will navigate)',
        'Click "Add to Carousel"',
        'Images will auto-slide every few seconds',
      ],
    },
    {
      step: 4,
      title: 'Reorder Carousel Images',
      description: 'Change the order of carousel slides using arrow buttons.',
      details: [
        'Use ⬆️ Up arrow to move image earlier in sequence',
        'Use ⬇️ Down arrow to move image later in sequence',
        'First image shows first when page loads',
      ],
    },
    {
      step: 5,
      title: 'Update or Remove Images',
      description: 'Edit links or remove images from carousel.',
      details: [
        'Edit link URL and click "Save" to update where Buy Now button goes',
        'Click trash icon 🗑️ to remove image from carousel',
        'Use "Refresh" button to reload available images after uploads',
      ],
    },
    {
      step: 6,
      title: 'Preview on Homepage',
      description: 'Visit your site\'s homepage to see the carousel in action.',
      details: [
        'Main carousel auto-slides with fade transition',
        'Hero thumbnails are static (clickable if linked)',
        'Desktop: 50-50 split layout',
        'Mobile: Carousel on top, thumbnails in 2x2 grid below',
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Carousel Management</h1>
        <InstructionDialog
          title="How to Manage Carousel & Hero Images"
          instructions={carouselInstructions}
        />
      </div>

      {/* Hero Thumbnails - 4 static images for the right side (50% on desktop) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-2">Hero Thumbnails (4 static images)</h2>
        <p className="text-sm text-gray-500 mb-4">
          These 4 images appear on the right side of the hero carousel (50% width on desktop, below on mobile). Each can have a link.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[1, 2, 3, 4].map((order) => {
            const thumb = heroThumbnails.find((t) => t.order === order)!;
            return (
              <div key={order} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {thumb.url ? (
                    <Image src={thumb.url} alt={`Thumbnail ${order}`} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Slot {order}</div>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  <input
                    type="text"
                    value={thumb.linkUrl || ''}
                    onChange={(e) => setHeroThumbnailLink(order, e.target.value)}
                    placeholder="Link URL (e.g. /products/...)"
                    className="w-full text-xs rounded border-gray-300"
                  />
                  <div className="flex flex-wrap gap-1">
                    {availableImages.slice(0, 8).map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setHeroThumbnailSlot(order, img)}
                        className={`w-8 h-8 rounded overflow-hidden border-2 ${
                          thumb.url === img ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <Image src={img} alt="" width={32} height={32} className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeroThumbnailSlot(order, '', null)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleSaveHeroThumbnails}
          disabled={savingThumbnails}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {savingThumbnails ? 'Saving...' : 'Save Hero Thumbnails'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Tip: Select from the small previews above, or use the full Available Images grid below (click one, then click a slot).
        </p>
      </div>
      
      {/* Current Carousel Images */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Current Carousel Images</h2>
          <button
            onClick={refreshImages}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            🔄 Refresh Images
          </button>
        </div>
        
        {images.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-500">No images in the carousel yet.</p>
            <p className="text-gray-500 text-sm mt-1">Select images from the available images section below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <div className="relative aspect-video w-full">
                  <Image 
                    src={image.url} 
                    alt={`Carousel image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Position: {index + 1}</span>
                      <div className="text-xs text-gray-500 truncate max-w-24">
                        {(() => {
                          const parts = image.url.split('/');
                          const fileName = parts[parts.length - 1];
                          return fileName.split('.')[0].replace(/[-_]/g, ' ');
                        })()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReorderImage(image.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-300"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReorderImage(image.id, 'down')}
                        disabled={index === images.length - 1}
                        className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-300"
                      >
                        <ArrowDown className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(image.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Link URL (optional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={linkInputs[image.id] ?? ''}
                        onChange={(e) => handleLinkInputChange(image.id, e.target.value)}
                        placeholder="/products/iphone-16"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                      />
                      <button
                        onClick={() => handleSaveLink(image.id)}
                        disabled={savingLinkId === image.id}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {savingLinkId === image.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Available Images */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Available Images</h2>
          <div className="flex gap-2">
            <button
              onClick={refreshImages}
              className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              🔄 Refresh
            </button>
            <a
              href="/admin/images"
              target="_blank"
              className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
            >
              📁 Upload New
            </a>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-700">
            💡 <strong>Need to upload new images?</strong> Go to{' '}
            <a 
              href="/admin/images" 
              target="_blank"
              className="font-medium underline hover:text-purple-800"
            >
              Image Management
            </a>{' '}
            to upload new carousel images, then come back and refresh this list.
          </p>
        </div>
        
        {/* Selected image */}
        {selectedImage && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Selected Image:</h3>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex items-center space-x-4">
                <div className="relative w-32 h-20 bg-gray-100 rounded overflow-hidden">
                  <Image 
                    src={selectedImage}
                    alt="Selected carousel image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Link URL (optional)
                </label>
                <input
                  type="text"
                  value={newImageLink}
                  onChange={(e) => setNewImageLink(e.target.value)}
                  placeholder="/products/iphone-16"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Use relative URLs like /products/iphone-16</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAddImage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ImagePlus className="h-5 w-5 mr-2" />
                  Add to Carousel
                </button>
                <span className="text-gray-400 text-sm self-center">or assign to Hero Thumbnail:</span>
                {[1, 2, 3, 4].map((order) => (
                  <button
                    key={order}
                    type="button"
                    onClick={() => setHeroThumbnailSlot(order, selectedImage, newImageLink || null)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Slot {order}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {availableImages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No carousel images available.</p>
            <p className="text-gray-400 text-sm mt-1">Upload images using the "Images" section in the admin panel with the "carousel" folder.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableImages.map((image, index) => (
              <div 
                key={index}
                onClick={() => setSelectedImage(image)}
                className={`relative bg-gray-50 border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 
                  ${selectedImage === image ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md border-gray-200'}`}
              >
                <div className="relative w-full aspect-video">
                  <Image 
                    src={image}
                    alt={`Available image ${index + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">
                  {(() => {
                    const parts = image.split('/');
                    const fileName = parts[parts.length - 1];
                    return fileName.split('.')[0].replace(/[-_]/g, ' ');
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
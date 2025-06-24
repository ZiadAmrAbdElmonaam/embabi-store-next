'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, ImagePlus, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface CarouselImage {
  id: string;
  url: string;
  order: number;
}

export default function CarouselManagementPage() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        
        // Fetch current carousel images
        const imagesResponse = await fetch('/api/admin/carousel');
        if (!imagesResponse.ok) throw new Error('Failed to fetch carousel images');
        const carouselData = await imagesResponse.json();
        
        // Ensure images array exists even if API returns incomplete data
        setImages(carouselData.images || []);
        
        // Fetch available images from both local and Cloudinary
        const availableResponse = await fetch('/api/images/carousel');
        if (!availableResponse.ok) throw new Error('Failed to fetch available images');
        const availableData = await availableResponse.json();
        // Extract URLs from the {url, source} format
        const imageUrls = availableData.map((img: any) => img.url);
        setAvailableImages(imageUrls || []);
      } catch (error) {
        console.error('Failed to fetch carousel data:', error);
        toast.error('Failed to load carousel data');
        // Set empty arrays to prevent undefined errors
        setImages([]);
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
      const response = await fetch('/api/admin/carousel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: selectedImage,
          order: images.length + 1, // Add to the end
        }),
      });

      if (!response.ok) throw new Error('Failed to add image');
      
      const result = await response.json();
      setImages([...images, result.image]);
      setSelectedImage(null);
      toast.success('Image added to carousel');
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image to carousel');
    }
  };

  const handleRemoveImage = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/carousel/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove image');
      
      // Remove from local state
      setImages(images.filter(img => img.id !== id));
      toast.success('Image removed from carousel');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image from carousel');
    }
  };

  const handleReorderImage = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/admin/carousel/reorder`, {
        method: 'PUT',
        headers: {
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
      
      toast.success('Carousel order updated');
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder carousel images');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Carousel Management</h1>
      
      {/* Current Carousel Images */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Current Carousel Images</h2>
        
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
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">Position: {index + 1}</span>
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
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Available Images */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Available Images</h2>
        
        {/* Selected image */}
        {selectedImage && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Selected Image:</h3>
            <div className="flex items-center space-x-4">
              <div className="relative w-32 h-20 bg-gray-100 rounded overflow-hidden">
                <Image 
                  src={selectedImage}
                  alt="Selected carousel image"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={handleAddImage}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ImagePlus className="h-5 w-5 mr-2" />
                Add to Carousel
              </button>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
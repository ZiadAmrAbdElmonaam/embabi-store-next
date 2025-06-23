'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface UploadedImage {
  url: string;
  publicId: string;
  originalName: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

interface ImageUploadProps {
  folder: 'products' | 'categories' | 'carousel';
  onImagesUploaded: (images: UploadedImage[]) => void;
  maxFiles?: number;
  existingImages?: string[];
}

export function ImageUpload({ 
  folder, 
  onImagesUploaded, 
  maxFiles = 5,
  existingImages = []
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    const totalFiles = uploadedImages.length + existingImages.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('folder', folder);

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      const newImages = data.images;

      setUploadedImages(prev => [...prev, ...newImages]);
      onImagesUploaded(newImages);
      
      toast.success(`${newImages.length} image(s) uploaded successfully!`);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedImage = async (imageToRemove: UploadedImage) => {
    try {
      // Optional: Delete from Cloudinary
      // You can uncomment this if you want to delete from Cloudinary immediately
      /*
      await fetch('/api/upload/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: imageToRemove.publicId }),
      });
      */

      setUploadedImages(prev => prev.filter(img => img.publicId !== imageToRemove.publicId));
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor={`file-upload-${folder}`} className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Upload {folder} images
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB (Max {maxFiles} files)
              </span>
            </label>
            <input
              ref={fileInputRef}
              id={`file-upload-${folder}`}
              name={`file-upload-${folder}`}
              type="file"
              className="sr-only"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading || (uploadedImages.length + existingImages.length >= maxFiles)}
            />
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || (uploadedImages.length + existingImages.length >= maxFiles)}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Images
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Newly Uploaded Images ({uploadedImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.publicId} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-green-500">
                  <Image
                    src={image.url}
                    alt={image.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(image)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500 truncate">
                  <p className="truncate">{image.originalName}</p>
                  <p>{image.width}×{image.height} • {formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress/Status */}
      {(uploadedImages.length > 0 || existingImages.length > 0) && (
        <div className="text-sm text-gray-600">
          {uploadedImages.length + existingImages.length} of {maxFiles} images selected
        </div>
      )}
    </div>
  );
} 
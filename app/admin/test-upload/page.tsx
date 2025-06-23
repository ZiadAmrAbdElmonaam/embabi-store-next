'use client';

import { ImageUpload } from '@/components/admin/image-upload';

export default function TestUploadPage() {
  const handleImagesUploaded = (images: any[]) => {
    console.log('Uploaded images:', images);
    alert(`${images.length} images uploaded successfully!`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Test Cloudinary Upload</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Upload Product Images</h2>
          <ImageUpload 
            folder="products"
            onImagesUploaded={handleImagesUploaded}
            maxFiles={3}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Upload Category Images</h2>
          <ImageUpload 
            folder="categories"
            onImagesUploaded={handleImagesUploaded}
            maxFiles={1}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Upload Carousel Images</h2>
          <ImageUpload 
            folder="carousel"
            onImagesUploaded={handleImagesUploaded}
            maxFiles={5}
          />
        </div>
      </div>
    </div>
  );
} 
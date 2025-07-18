import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  try {
    // 1. Get local images from public folder
    const carouselDir = path.join(process.cwd(), 'public', 'images', 'carousel');
    let localImages: string[] = [];
    
    try {
      const files = fs.readdirSync(carouselDir);
      localImages = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => `/images/carousel/${file}`);
    } catch (error) {
      console.log('Local carousel directory not found or empty');
    }

    // 2. Get Cloudinary images from embabi-store/carousel folder
    let cloudinaryImages: string[] = [];
    
    try {
      const cloudinaryResult = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'embabi-store/carousel/',
        max_results: 100,
        resource_type: 'image'
      });

      cloudinaryImages = cloudinaryResult.resources.map((resource: any) => {
        // Extract filename from public_id (last part after the last slash)
        const publicIdParts = resource.public_id.split('/');
        const filename = publicIdParts[publicIdParts.length - 1];
        
        // Make filename more readable: convert underscores to spaces and capitalize
        const readableFilename = filename.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return {
          url: resource.secure_url,
          originalFilename: resource.original_filename || readableFilename,
          publicId: resource.public_id
        };
      });
    } catch (error) {
      console.log('Error fetching Cloudinary images or no images found:', error);
    }

    // 3. Combine both sources
    const allImages = [
      ...localImages.map(url => ({ 
        url, 
        source: 'local',
        originalFilename: url.split('/').pop()?.split('.')[0] || 'unknown'
      })),
      ...cloudinaryImages.map(item => ({ 
        url: item.url, 
        source: 'cloudinary',
        originalFilename: item.originalFilename,
        publicId: item.publicId
      }))
    ];

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Error reading images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 
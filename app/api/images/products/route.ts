import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  try {
    // 1. Get local images from public folder
    const productsDir = path.join(process.cwd(), 'public', 'images', 'products');
    let localImages: string[] = [];
    
    try {
      const files = fs.readdirSync(productsDir);
      localImages = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => `/images/products/${file}`);
    } catch (error) {
      console.log('Local products directory not found or empty');
    }

    // 2. Get Cloudinary images from embabi-store/products folder
    let cloudinaryImages: string[] = [];
    
    try {
      const cloudinaryResult = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'embabi-store/products/',
        max_results: 500, // Increased to handle more images
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

    const response = NextResponse.json(allImages);
    
    // Add caching headers - cache for 5 minutes to allow new uploads to appear faster
    // Temporarily set to no-cache for testing, change back to 300 after testing
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error reading images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 
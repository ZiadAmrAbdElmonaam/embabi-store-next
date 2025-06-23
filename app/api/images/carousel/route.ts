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

      cloudinaryImages = cloudinaryResult.resources.map((resource: any) => resource.secure_url);
    } catch (error) {
      console.log('Error fetching Cloudinary images or no images found:', error);
    }

    // 3. Combine both sources
    const allImages = [
      ...localImages.map(url => ({ url, source: 'local' })),
      ...cloudinaryImages.map(url => ({ url, source: 'cloudinary' }))
    ];

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Error reading images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 
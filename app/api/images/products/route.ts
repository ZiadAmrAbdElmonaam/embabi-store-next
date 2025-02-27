import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the absolute path to the products images directory
    const productsDir = path.join(process.cwd(), 'public', 'images', 'products');
    
    // Read the directory
    const files = fs.readdirSync(productsDir);
    
    // Filter for image files and create URLs
    const imageUrls = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `/images/products/${file}`);
    
    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error('Error reading products directory:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 
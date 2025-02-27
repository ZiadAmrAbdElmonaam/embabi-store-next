import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the absolute path to the categories images directory
    const categoriesDir = path.join(process.cwd(), 'public', 'images', 'categories');
    
    // Read the directory
    const files = fs.readdirSync(categoriesDir);
    
    // Filter for image files and create URLs
    const imageUrls = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `/images/categories/${file}`);
    
    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error('Error reading categories directory:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 
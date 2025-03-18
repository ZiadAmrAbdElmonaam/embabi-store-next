import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";
import fs from 'fs';
import path from 'path';

// Path to the folder that contains carousel images
const carouselFolderPath = path.join(process.cwd(), 'public', 'images', 'carousel');

// GET endpoint to retrieve available carousel images
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create the carousel folder if it doesn't exist
    if (!fs.existsSync(carouselFolderPath)) {
      fs.mkdirSync(carouselFolderPath, { recursive: true });
    }

    // Get all files from the carousel folder
    const files = fs.readdirSync(carouselFolderPath);
    
    // Filter for image files only (jpg, jpeg, png, webp, gif)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const imageFiles = files.filter(file => 
      imageExtensions.includes(path.extname(file).toLowerCase())
    );

    // Convert to URLs for the frontend
    const imageUrls = imageFiles.map(file => 
      `/images/carousel/${file}`
    );

    return NextResponse.json({ images: imageUrls });
  } catch (error) {
    console.error('Error fetching available carousel images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available carousel images', images: [] },
      { status: 500 }
    );
  }
} 
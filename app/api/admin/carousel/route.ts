import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth-options";
import fs from 'fs';
import path from 'path';

// Path to the JSON file that stores carousel information
const carouselConfigPath = path.join(process.cwd(), 'public', 'carousel-config.json');

// Initialize the carousel config file if it doesn't exist
const initCarouselConfig = () => {
  if (!fs.existsSync(carouselConfigPath)) {
    fs.writeFileSync(
      carouselConfigPath, 
      JSON.stringify({ images: [] }, null, 2),
      'utf-8'
    );
  }
};

// Get carousel configuration
const getCarouselConfig = () => {
  initCarouselConfig();
  const configData = fs.readFileSync(carouselConfigPath, 'utf-8');
  return JSON.parse(configData);
};

// Save carousel configuration
const saveCarouselConfig = (config) => {
  fs.writeFileSync(
    carouselConfigPath,
    JSON.stringify(config, null, 2),
    'utf-8'
  );
};

// GET endpoint to retrieve carousel images
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const carouselConfig = getCarouselConfig();
    return NextResponse.json(carouselConfig);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel images' },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new carousel image
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { url, order } = data;

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the new image
    const id = `img_${Date.now()}`;
    
    // Add the new image to the carousel config
    const carouselConfig = getCarouselConfig();
    const newImage = { id, url, order: order || carouselConfig.images.length + 1 };
    carouselConfig.images.push(newImage);
    
    // Sort images by order
    carouselConfig.images.sort((a, b) => a.order - b.order);
    
    // Save the updated config
    saveCarouselConfig(carouselConfig);

    return NextResponse.json({ 
      message: 'Image added successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Error adding carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to add carousel image' },
      { status: 500 }
    );
  }
} 
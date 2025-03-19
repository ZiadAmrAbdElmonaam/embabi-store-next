import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Path to the JSON file that stores carousel information
const carouselConfigPath = path.join(process.cwd(), 'public', 'carousel-config.json');

// GET endpoint to retrieve carousel images for the frontend
export async function GET() {
  try {
    // Check if the carousel config exists
    if (!fs.existsSync(carouselConfigPath)) {
      return NextResponse.json({ images: [] });
    }

    // Read the carousel config
    const configData = fs.readFileSync(carouselConfigPath, 'utf-8');
    
    // Parse safely
    let carouselConfig;
    try {
      carouselConfig = JSON.parse(configData);
    } catch (parseError) {
      console.error('Error parsing carousel config:', parseError);
      return NextResponse.json({ images: [] });
    }

    // Ensure images property exists
    if (!carouselConfig || !carouselConfig.images || !Array.isArray(carouselConfig.images)) {
      return NextResponse.json({ images: [] });
    }

    // Sort by order
    carouselConfig.images.sort((a, b) => a.order - b.order);

    return NextResponse.json({ images: carouselConfig.images });
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel images', images: [] },
      { status: 500 }
    );
  }
}


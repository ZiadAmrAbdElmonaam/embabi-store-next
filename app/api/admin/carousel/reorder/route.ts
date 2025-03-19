import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";
import fs from 'fs';
import path from 'path';

// Path to the JSON file that stores carousel information
const carouselConfigPath = path.join(process.cwd(), 'public', 'carousel-config.json');

// Get carousel configuration
const getCarouselConfig = () => {
  if (!fs.existsSync(carouselConfigPath)) {
    return { images: [] };
  }
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

// PUT endpoint to reorder carousel images
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, newOrder } = data;

    if (!id || newOrder === undefined) {
      return NextResponse.json(
        { error: 'Image ID and new order are required' },
        { status: 400 }
      );
    }

    // Get the current carousel config
    const carouselConfig = getCarouselConfig();

    // Find the image to reorder
    const imageIndex = carouselConfig.images.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get the current order
    const currentOrder = carouselConfig.images[imageIndex].order;

    // Update orders for all affected images
    carouselConfig.images.forEach(img => {
      if (img.id === id) {
        // Set the new order for the target image
        img.order = newOrder;
      } 
      else if (
        // If moving up, decrement images in between
        (currentOrder > newOrder && img.order >= newOrder && img.order < currentOrder) ||
        // If moving down, increment images in between
        (currentOrder < newOrder && img.order <= newOrder && img.order > currentOrder)
      ) {
        img.order = currentOrder > newOrder 
          ? img.order + 1  // Moving up
          : img.order - 1; // Moving down
      }
    });

    // Sort images by order
    carouselConfig.images.sort((a, b) => a.order - b.order);

    // Save the updated config
    saveCarouselConfig(carouselConfig);

    return NextResponse.json({ 
      message: 'Image order updated successfully',
      images: carouselConfig.images
    });
  } catch (error) {
    console.error('Error reordering carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to reorder carousel image' },
      { status: 500 }
    );
  }
} 
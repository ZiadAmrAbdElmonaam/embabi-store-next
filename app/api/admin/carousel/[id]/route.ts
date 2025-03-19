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

// DELETE endpoint to remove a carousel image
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get the current carousel config
    const carouselConfig = getCarouselConfig();

    // Find the image to delete
    const imageIndex = carouselConfig.images.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Remove the image
    carouselConfig.images.splice(imageIndex, 1);

    // Reassign order numbers sequentially
    carouselConfig.images.forEach((img, index) => {
      img.order = index + 1;
    });

    // Save the updated config
    saveCarouselConfig(carouselConfig);

    return NextResponse.json({ 
      message: 'Image removed successfully'
    });
  } catch (error) {
    console.error('Error removing carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to remove carousel image' },
      { status: 500 }
    );
  }
}


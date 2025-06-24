import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";
import { prisma } from "@/lib/prisma";

// PUT endpoint to reorder carousel images (simplified version)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, direction } = data;

    if (!id || !direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Image ID and direction (up/down) are required' },
        { status: 400 }
      );
    }

    // Get the current image
    const currentImage = await prisma.carouselImage.findUnique({
      where: { id }
    });

    if (!currentImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get all images ordered by order
    const allImages = await prisma.carouselImage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    const currentIndex = allImages.findIndex(img => img.id === id);
    
    // Check if move is possible
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === allImages.length - 1)
    ) {
      return NextResponse.json({ 
        message: 'Cannot move image further in that direction',
        images: allImages
      });
    }

    // Simple swap with adjacent image
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapImage = allImages[swapIndex];

    // Swap the order values
    await prisma.$transaction([
      prisma.carouselImage.update({
        where: { id: currentImage.id },
        data: { order: swapImage.order }
      }),
      prisma.carouselImage.update({
        where: { id: swapImage.id },
        data: { order: currentImage.order }
      })
    ]);

    // Get updated images
    const updatedImages = await prisma.carouselImage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ 
      message: 'Image order updated successfully',
      images: updatedImages
    });
  } catch (error) {
    console.error('Error reordering carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to reorder carousel image' },
      { status: 500 }
    );
  }
} 
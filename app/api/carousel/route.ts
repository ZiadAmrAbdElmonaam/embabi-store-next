import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET endpoint to retrieve carousel images for the frontend
export async function GET() {
  try {
    // Get active carousel images from database
    const images = await prisma.carouselImage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        url: true,
        order: true
      }
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel images', images: [] },
      { status: 500 }
    );
  }
}


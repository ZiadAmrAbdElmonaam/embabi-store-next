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

    const response = NextResponse.json({ images });
    
    // Add caching headers - cache for 15 minutes (carousel changes infrequently)
    response.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    
    return response;
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel images', images: [] },
      { status: 500 }
    );
  }
}


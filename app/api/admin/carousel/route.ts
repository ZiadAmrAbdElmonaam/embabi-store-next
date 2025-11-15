import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET endpoint to retrieve carousel images
export async function GET() {
  try {
    console.log('🔍 Admin carousel GET endpoint called');
    
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session?.user?.role);
    
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗄️ Attempting to query CarouselImage table...');
    
    // Try with Prisma model first, fallback to raw SQL if needed
    let images;
    try {
      images = await prisma.carouselImage.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          url: true,
          order: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          linkUrl: true,
        },
      });
    } catch (prismaError) {
      console.log('⚠️ Prisma model failed, trying raw SQL...', prismaError.message);
      // Fallback to raw SQL query
      images = await prisma.$queryRaw`
        SELECT id, url, "order", "isActive", "createdAt", "updatedAt" 
        FROM "CarouselImage" 
        WHERE "isActive" = true 
        ORDER BY "order" ASC
      `;
    }

    console.log('✅ Successfully fetched carousel images:', images.length);
    return NextResponse.json({ images });
  } catch (error) {
    console.error('❌ Error fetching carousel images:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch carousel images',
        details: error.message 
      },
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
    const { url, order, linkUrl } = data;

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get the highest order number and add 1, or use provided order
    const maxOrder = await prisma.carouselImage.aggregate({
      _max: { order: true }
    });
    
    const newOrder = order || (maxOrder._max.order || 0) + 1;

    // Create the new carousel image
    const newImage = await prisma.carouselImage.create({
      data: {
        url,
        order: newOrder,
        isActive: true,
        linkUrl: linkUrl || null,
      },
    });

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
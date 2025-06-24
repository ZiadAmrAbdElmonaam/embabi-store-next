import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";
import { prisma } from "@/lib/prisma";

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

    // Check if image exists
    const existingImage = await prisma.carouselImage.findUnique({
      where: { id }
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete the image
    await prisma.carouselImage.delete({
      where: { id }
    });

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


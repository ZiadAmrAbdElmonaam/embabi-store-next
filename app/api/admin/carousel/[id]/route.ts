import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/auth-options";
import { prisma } from "@/lib/prisma";
import { requireCsrfOrReject } from "@/lib/csrf";

// DELETE endpoint to remove a carousel image
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
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

// PATCH endpoint to update carousel image metadata (e.g., link URL)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
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

    const body = await request.json();
    const { linkUrl, isActive } = body;

    if (linkUrl !== undefined && linkUrl !== null && typeof linkUrl !== 'string') {
      return NextResponse.json(
        { error: 'linkUrl must be a string when provided' },
        { status: 400 }
      );
    }

    const data: Record<string, any> = {};
    if (typeof linkUrl !== 'undefined') {
      data.linkUrl = linkUrl?.trim() ? linkUrl.trim() : null;
    }
    if (typeof isActive === 'boolean') {
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const updatedImage = await prisma.carouselImage.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: 'Carousel image updated successfully',
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error updating carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to update carousel image' },
      { status: 500 }
    );
  }
}


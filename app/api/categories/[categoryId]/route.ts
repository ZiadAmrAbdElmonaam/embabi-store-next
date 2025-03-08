import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Check if there are products in this category
    const productsCount = await prisma.product.count({
      where: {
        categoryId: params.categoryId
      }
    });
    
    if (productsCount > 0) {
      // Option 1: Prevent deletion if products exist
      return NextResponse.json(
        { error: `Cannot delete category because it contains ${productsCount} products. Please delete or move these products first.` },
        { status: 400 }
      );
      
      // Option 2 (commented out): Delete all products in the category first
      // await prisma.product.deleteMany({
      //   where: {
      //     categoryId: params.categoryId
      //   }
      // });
    }

    // Now delete the category
    await prisma.category.delete({
      where: {
        id: params.categoryId,
      },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    // Add more detailed error messages
    let errorMessage = 'Failed to delete category';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const body = await request.json();
    const { name, description, image } = body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await prisma.category.update({
      where: {
        id: params.categoryId,
      },
      data: {
        name,
        description,
        image,
        slug,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
} 
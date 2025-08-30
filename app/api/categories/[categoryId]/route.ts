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
    const { name, description, image, parentId, brand } = body;

    // Generate slug from name (with parent context if applicable)
    let slug;
    if (parentId) {
      // For subcategories: combine child name + parent name
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
        select: { name: true }
      });
      
      if (parentCategory) {
        // Format: childName-parentName (e.g., "apple-mobiles")
        slug = `${name}-${parentCategory.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      } else {
        // Fallback if parent not found
        slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
    } else {
      // For main categories: use name only
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Prevent setting a category as its own parent or creating circular references
    if (parentId === params.categoryId) {
      return NextResponse.json(
        { error: 'A category cannot be its own parent' },
        { status: 400 }
      );
    }

    // Check for circular reference (if parentId is provided)
    if (parentId) {
      const potentialParent = await prisma.category.findUnique({
        where: { id: parentId },
        include: { parent: true }
      });

      if (potentialParent?.parentId === params.categoryId) {
        return NextResponse.json(
          { error: 'This would create a circular reference' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: {
        id: params.categoryId,
      },
      data: {
        name,
        description,
        image,
        parentId: parentId || null,
        brand: brand || null,
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
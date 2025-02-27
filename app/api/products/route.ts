import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.description || !data.price || !data.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 400 }
      );
    }

    // Parse numeric values
    const price = parseFloat(data.price);
    const stock = parseInt(data.stock) || 0;
    const sale = data.sale ? parseFloat(data.sale) : null;
    const salePrice = data.salePrice ? parseFloat(data.salePrice) : null;

    // Create the product with all fields
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: price,
        stock: stock,
        images: data.images || [],
        thumbnails: data.thumbnails || [],
        slug,
        categoryId: data.categoryId,
        sale: sale,
        salePrice: salePrice,
        saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : null,
        // Create variants
        variants: {
          create: data.variants?.map((variant: any) => ({
            color: variant.color,
            quantity: parseInt(variant.quantity),
          })) || [],
        },
        // Create details
        details: {
          create: data.details?.map((detail: any) => ({
            label: detail.label,
            description: detail.description,
          })) || [],
        },
      },
      // Include relations in response
      include: {
        variants: true,
        details: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        details: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 
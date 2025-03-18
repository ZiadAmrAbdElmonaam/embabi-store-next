import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth-options";
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the adminDashboard flag to trigger our middleware
    const products = await prisma.product.findMany({
      where: {
        adminDashboard: true // This custom flag will be removed by our middleware
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal to number for serialization
    const serializedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
    }));

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Create slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Validate required fields
    if (!data.name || !data.price || !data.stock || !data.categoryId || data.thumbnails.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        categoryId: data.categoryId,
        sale: data.sale ? parseFloat(data.sale) : null,
        saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : null,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        thumbnails: data.thumbnails,
        details: {
          create: data.details.map((detail: any) => ({
            label: detail.label,
            description: detail.description,
          })),
        },
        variants: {
          create: data.variants.map((variant: any) => ({
            color: variant.color,
            quantity: parseInt(variant.quantity),
          })),
        },
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
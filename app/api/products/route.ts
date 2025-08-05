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

    // Create slug from name - Google-friendly format
    const slug = data.name
      .toLowerCase()
      .replace(/(\d+)/g, '-$1')  // Add hyphen before numbers
      .replace(/[^a-z0-9-]+/g, '-')  // Convert other chars to hyphens
      .replace(/(^-|-$)/g, '')  // Remove leading/trailing hyphens
      .replace(/-+/g, '-');  // Replace multiple hyphens with single hyphen

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
        // Create storage options
        storages: {
          create: data.storages?.map((storage: any) => ({
            size: storage.size,
            price: parseFloat(storage.price),
            stock: parseInt(storage.stock),
            salePercentage: storage.salePercentage ? parseFloat(storage.salePercentage) : null,
            saleEndDate: storage.saleEndDate ? new Date(storage.saleEndDate) : null,
            variants: {
              create: storage.variants?.map((variant: any) => ({
                color: variant.color,
                quantity: parseInt(variant.quantity),
              })) || [],
            },
          })) || [],
        },
      },
      // Include relations in response
      include: {
        variants: true,
        details: true,
        storages: {
          include: {
            variants: true,
          },
        },
      },
    });

    // Convert Decimal to number for serialization  
    const serializedProduct = {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      saleEndDate: product.saleEndDate?.toISOString() || null,
      storages: product.storages.map(storage => ({
        ...storage,
        price: Number(storage.price),
        createdAt: storage.createdAt.toISOString(),
        updatedAt: storage.updatedAt.toISOString(),
        saleEndDate: storage.saleEndDate?.toISOString() || null,
      })),
    };

    return NextResponse.json(serializedProduct);
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
        storages: {
          include: {
            variants: true,
          },
        },
      },
    });

    // Convert Decimal to number for serialization
    const serializedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      saleEndDate: product.saleEndDate?.toISOString() || null,
      storages: product.storages.map(storage => ({
        ...storage,
        price: Number(storage.price),
        createdAt: storage.createdAt.toISOString(),
        updatedAt: storage.updatedAt.toISOString(),
        saleEndDate: storage.saleEndDate?.toISOString() || null,
      })),
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
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { requireCsrfOrReject } from "@/lib/csrf";

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
        storages: {
          include: {
            units: true,
          },
        },
        variants: true,
        details: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serializedProducts = products.map(product => ({
      ...product,
      price: product.price != null ? Number(product.price) : null,
      storages: product.storages.map(storage => ({
        ...storage,
        price: Number(storage.price),
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

export async function POST(request: Request) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Create slug from name - Google-friendly format
    const slug = data.name
      .toLowerCase()
      .replace(/(\d+)/g, '-$1')  // Add hyphen before numbers
      .replace(/[^a-z0-9-]+/g, '-')  // Convert other chars to hyphens
      .replace(/(^-|-$)/g, '')  // Remove leading/trailing hyphens
      .replace(/-+/g, '-');  // Replace multiple hyphens with single hyphen

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
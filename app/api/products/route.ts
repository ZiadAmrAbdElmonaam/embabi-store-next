import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { requireCsrfOrReject } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const productType = data.productType || (data.storages?.length > 0 ? 'STORAGE' : 'SIMPLE');
    
    // Validate based on product type
    if (!data.name || !data.description || !data.categoryId) {
      return NextResponse.json({ error: 'Missing required fields: name, description, category' }, { status: 400 });
    }
    if (productType === 'SIMPLE') {
      if (data.price == null || data.price === '' || data.stock == null || data.stock === '') {
        return NextResponse.json({ error: 'Price and stock are required for simple products' }, { status: 400 });
      }
    } else {
      if (!data.storages?.length) {
        return NextResponse.json({ error: 'At least one storage option is required for multi-storage products' }, { status: 400 });
      }
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

    const price = productType === 'SIMPLE' ? parseFloat(data.price) : null;
    const stock = productType === 'SIMPLE' ? (parseInt(data.stock) || 0) : null;
    const sale = productType === 'SIMPLE' && data.sale ? parseFloat(data.sale) : null;
    const salePrice = productType === 'SIMPLE' && data.salePrice ? parseFloat(data.salePrice) : null;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        productType,
        price,
        stock,
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
        // Create storage options with units
        storages: {
          create: data.storages?.map((storage: any) => ({
            size: storage.size,
            price: parseFloat(storage.price),
            salePercentage: storage.salePercentage ? parseFloat(storage.salePercentage) : null,
            saleEndDate: storage.saleEndDate ? new Date(storage.saleEndDate) : null,
            units: {
              create: storage.units?.map((u: any) => ({
                color: u.color,
                stock: parseInt(String(u.stock)) || 0,
                taxStatus: u.taxStatus || 'UNPAID',
                taxType: u.taxType || 'FIXED',
                taxAmount: u.taxType === 'FIXED' && u.taxAmount != null ? parseFloat(u.taxAmount) : null,
                taxPercentage: u.taxType === 'PERCENTAGE' && u.taxPercentage != null ? parseFloat(u.taxPercentage) : null,
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
            units: true,
          },
        },
      },
    });

    const serializedProduct = {
      ...product,
      price: product.price != null ? Number(product.price) : null,
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
        units: storage.units.map(u => ({
          ...u,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })),
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
            units: true,
          },
        },
      },
    });

    const serializedProducts = products.map(product => ({
      ...product,
      price: product.price != null ? Number(product.price) : null,
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
        units: storage.units.map(u => ({
          ...u,
          taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
          taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
        })),
      })),
    }));

    const response = NextResponse.json(serializedProducts);
    
    // Add caching headers - cache for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { requireCsrfOrReject } from "@/lib/csrf";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const csrfReject = requireCsrfOrReject(req);
    if (csrfReject) return csrfReject;
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { productId } = await params;
    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      categoryId,
      sale,
      saleEndDate,
      images,
      thumbnails,
      variants,
      details,
      storages,
      productType: bodyProductType,
    } = body;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const productType = bodyProductType || (storages?.length > 0 ? 'STORAGE' : 'SIMPLE');
    const finalPrice = productType === 'SIMPLE' && price != null ? parseFloat(price) : null;
    const finalStock = productType === 'SIMPLE' && stock != null ? parseInt(stock) : null;
    const saleNum = productType === 'SIMPLE' && sale ? parseFloat(sale) : null;
    const salePrice = finalPrice != null && saleNum ? finalPrice - (finalPrice * (saleNum / 100)) : null;

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        productType,
        price: finalPrice,
        stock: finalStock,
        categoryId,
        sale: saleNum,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        images: images ?? [],
        thumbnails: thumbnails ?? [],
        salePrice,
      },
    });

    // Update variants
    if (variants) {
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId },
      });

      // Create new variants
      await Promise.all(
        variants.map((variant: { color: string; quantity: number }) =>
          prisma.productVariant.create({
            data: {
              color: variant.color,
              quantity: variant.quantity,
              productId,
            },
          })
        )
      );
    }

    // Update details
    if (details) {
      // Delete existing details
      await prisma.productDetail.deleteMany({
        where: { productId },
      });

      // Create new details
      await Promise.all(
        details.map((detail: { label: string; description: string }) =>
          prisma.productDetail.create({
            data: {
              label: detail.label,
              description: detail.description,
              productId,
            },
          })
        )
      );
    }

    // Update storages
    if (storages !== undefined) {
      // Delete existing storage units first (cascade will handle when we delete storages, but we delete storages after)
      const existingStorages = await prisma.productStorage.findMany({
        where: { productId },
        select: { id: true },
      });

      for (const existingStorage of existingStorages) {
        await prisma.productStorageUnit.deleteMany({
          where: { storageId: existingStorage.id },
        });
      }

      // Delete existing storages
      await prisma.productStorage.deleteMany({
        where: { productId },
      });

      // Create new storages with units
      if (storages && storages.length > 0) {
        await Promise.all(
          storages.map(async (storage: any) => {
            const createdStorage = await prisma.productStorage.create({
              data: {
                size: storage.size,
                price: parseFloat(storage.price),
                salePercentage: storage.salePercentage ? parseFloat(storage.salePercentage) : null,
                saleEndDate: storage.saleEndDate ? new Date(storage.saleEndDate) : null,
                productId,
              },
            });

            if (storage.units && storage.units.length > 0) {
              await prisma.productStorageUnit.createMany({
                data: storage.units.map((u: any) => ({
                  storageId: createdStorage.id,
                  color: u.color,
                  stock: parseInt(String(u.stock)) || 0,
                  taxStatus: u.taxStatus || 'UNPAID',
                  taxType: u.taxType || 'FIXED',
                  taxAmount: u.taxType === 'FIXED' && u.taxAmount != null ? parseFloat(u.taxAmount) : null,
                  taxPercentage: u.taxType === 'PERCENTAGE' && u.taxPercentage != null ? parseFloat(u.taxPercentage) : null,
                })),
              });
            }
          })
        );
      }
    }

    // Fetch the updated product with all relations for proper serialization
    const productWithRelations = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!productWithRelations) {
      return new NextResponse("Product not found", { status: 404 });
    }

    const serializedProduct = {
      ...productWithRelations,
      price: productWithRelations.price != null ? Number(productWithRelations.price) : null,
      salePrice: productWithRelations.salePrice ? Number(productWithRelations.salePrice) : null,
      discountPrice: productWithRelations.discountPrice ? Number(productWithRelations.discountPrice) : null,
      createdAt: productWithRelations.createdAt.toISOString(),
      updatedAt: productWithRelations.updatedAt.toISOString(),
      saleEndDate: productWithRelations.saleEndDate?.toISOString() || null,
      storages: productWithRelations.storages.map(storage => ({
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
    console.error("[PRODUCT_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
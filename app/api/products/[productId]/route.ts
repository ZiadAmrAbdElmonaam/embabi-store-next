import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
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
    } = body;

    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: {
        id: params.productId,
      },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        sale: sale || null,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        images,
        thumbnails,
        salePrice: sale ? price - (price * (sale / 100)) : null,
      },
    });

    // Update variants
    if (variants) {
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: params.productId },
      });

      // Create new variants
      await Promise.all(
        variants.map((variant: { color: string; quantity: number }) =>
          prisma.productVariant.create({
            data: {
              color: variant.color,
              quantity: variant.quantity,
              productId: params.productId,
            },
          })
        )
      );
    }

    // Update details
    if (details) {
      // Delete existing details
      await prisma.productDetail.deleteMany({
        where: { productId: params.productId },
      });

      // Create new details
      await Promise.all(
        details.map((detail: { label: string; description: string }) =>
          prisma.productDetail.create({
            data: {
              label: detail.label,
              description: detail.description,
              productId: params.productId,
            },
          })
        )
      );
    }

    // Update storages
    if (storages !== undefined) {
      // Delete existing storage variants first
      const existingStorages = await prisma.productStorage.findMany({
        where: { productId: params.productId },
        select: { id: true },
      });

      for (const existingStorage of existingStorages) {
        await prisma.productStorageVariant.deleteMany({
          where: { storageId: existingStorage.id },
        });
      }

      // Delete existing storages
      await prisma.productStorage.deleteMany({
        where: { productId: params.productId },
      });

      // Create new storages
      if (storages && storages.length > 0) {
        await Promise.all(
          storages.map(async (storage: any) => {
            const createdStorage = await prisma.productStorage.create({
              data: {
                size: storage.size,
                price: parseFloat(storage.price),
                stock: parseInt(storage.stock),
                salePercentage: storage.salePercentage ? parseFloat(storage.salePercentage) : null,
                saleEndDate: storage.saleEndDate ? new Date(storage.saleEndDate) : null,
                productId: params.productId,
              },
            });

            // Create storage variants
            if (storage.variants && storage.variants.length > 0) {
              await Promise.all(
                storage.variants.map((variant: { color: string; quantity: number }) =>
                  prisma.productStorageVariant.create({
                    data: {
                      color: variant.color,
                      quantity: parseInt(variant.quantity),
                      storageId: createdStorage.id,
                    },
                  })
                )
              );
            }
          })
        );
      }
    }

    // Fetch the updated product with all relations for proper serialization
    const productWithRelations = await prisma.product.findUnique({
      where: { id: params.productId },
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

    if (!productWithRelations) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Convert Decimal to number for serialization
    const serializedProduct = {
      ...productWithRelations,
      price: Number(productWithRelations.price),
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
      })),
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error("[PRODUCT_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
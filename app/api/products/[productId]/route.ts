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

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
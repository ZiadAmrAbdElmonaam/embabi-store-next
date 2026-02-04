import React from "react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { notFound } from "next/navigation";
import { Product, ProductVariant, ProductDetail, ProductStorage, ProductStorageUnit } from "@prisma/client";

type ProductWithRelations = Product & {
  variants: ProductVariant[];
  details: ProductDetail[];
  storages: (ProductStorage & {
    units: ProductStorageUnit[];
  })[];
};

interface EditProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

const serializeProduct = (product: ProductWithRelations) => {
  return {
    ...product,
    productType: product.productType || (product.storages?.length ? 'STORAGE' : 'SIMPLE'),
    price: product.price != null ? product.price.toString() : '',
    salePrice: product.salePrice?.toString() || null,
    discountPrice: product.discountPrice?.toString() || null,
    sale: product.sale?.toString() || null,
    stock: product.stock != null ? product.stock.toString() : '',
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    saleEndDate: product.saleEndDate?.toISOString() || null,
    storages: product.storages.map(storage => ({
      ...storage,
      price: storage.price.toString(),
      salePercentage: storage.salePercentage?.toString() || null,
      saleEndDate: storage.saleEndDate?.toISOString() || null,
      createdAt: storage.createdAt.toISOString(),
      updatedAt: storage.updatedAt.toISOString(),
      units: storage.units.map(u => ({
        ...u,
        taxAmount: u.taxAmount != null ? u.taxAmount.toString() : '0',
        taxPercentage: u.taxPercentage != null ? u.taxPercentage.toString() : '',
      })),
    })),
  };
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  if (!productId) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        variants: true,
        details: true,
        storages: {
          include: {
            units: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>
      <ProductForm 
        initialData={serializeProduct(product) as React.ComponentProps<typeof ProductForm>['initialData']}
        categories={categories}
      />
    </div>
  );
} 
/**
 * Export all products with units to a single Excel sheet.
 * - SIMPLE: one row per color variant (or one row if no variants).
 * - STORAGE: one row per unit (size + color + tax status).
 *
 * Run: npm run export-products-excel
 * Output: products-export.xlsx in project root
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

function getUnitCalculatedPrice(
  basePrice: number,
  salePercentage: number | null,
  saleEndDate: Date | null,
  unit: { taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }
): number {
  const salePrice =
    salePercentage != null && saleEndDate && new Date(saleEndDate) > new Date()
      ? basePrice - (basePrice * salePercentage) / 100
      : basePrice;
  if (unit.taxStatus === 'UNPAID') return salePrice;
  if (unit.taxType === 'FIXED') return salePrice + (Number(unit.taxAmount) || 0);
  if (unit.taxType === 'PERCENTAGE')
    return salePrice + (salePrice * (Number(unit.taxPercentage) || 0)) / 100;
  if (unit.taxAmount != null && Number(unit.taxAmount) > 0)
    return salePrice + Number(unit.taxAmount);
  if (unit.taxPercentage != null && Number(unit.taxPercentage) > 0)
    return salePrice + (salePrice * Number(unit.taxPercentage)) / 100;
  return salePrice;
}

function getSimplePriceAfterSale(
  price: number,
  sale: number | null,
  saleEndDate: Date | null,
  salePrice: number | null
): number {
  if (sale != null && saleEndDate && new Date(saleEndDate) > new Date()) {
    if (salePrice != null) return Number(salePrice);
    return price - (price * sale) / 100;
  }
  return price;
}

const HEADERS = [
  'Product ID',
  'Product Name',
  'Slug',
  'Product Type',
  'Category',
  'Parent Category',
  'Category Brand',
  'Storage ID',
  'Size',
  'Unit ID',
  'Color',
  'Stock',
  'Base Price',
  'Sale %',
  'Sale End Date',
  'Price After Sale',
  'Tax Status',
  'Tax Type',
  'Tax Amount',
  'Tax %',
  'Calculated Price',
  'Image URLs',
  'Featured',
];

type Row = Record<string, string | number | null | undefined>;

async function main() {
  const products = await prisma.product.findMany({
    include: {
      category: { include: { parent: true } },
      variants: true,
      storages: { include: { units: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows: Row[] = [];

  for (const p of products) {
    const categoryName = p.category?.name ?? '';
    const parentName = p.category?.parent?.name ?? '';
    const categoryBrand = p.category?.brand ?? '';
    const imageUrls = Array.isArray(p.images) ? (p.images as string[]).join(' | ') : '';

    if (p.productType === 'SIMPLE') {
      const basePrice = p.price != null ? Number(p.price) : 0;
      const priceAfterSale = getSimplePriceAfterSale(
        basePrice,
        p.sale ?? null,
        p.saleEndDate ?? null,
        p.salePrice ?? null
      );

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          rows.push({
            'Product ID': p.id,
            'Product Name': p.name,
            Slug: p.slug,
            'Product Type': 'SIMPLE',
            Category: categoryName,
            'Parent Category': parentName,
            'Category Brand': categoryBrand,
            'Storage ID': '',
            Size: '',
            'Unit ID': '',
            Color: v.color,
            Stock: v.quantity,
            'Base Price': basePrice,
            'Sale %': p.sale ?? '',
            'Sale End Date': p.saleEndDate ? new Date(p.saleEndDate).toISOString().slice(0, 10) : '',
            'Price After Sale': priceAfterSale,
            'Tax Status': '',
            'Tax Type': '',
            'Tax Amount': '',
            'Tax %': '',
            'Calculated Price': priceAfterSale,
            'Image URLs': imageUrls,
            Featured: p.featured ? 'Yes' : 'No',
          });
        }
      } else {
        rows.push({
          'Product ID': p.id,
          'Product Name': p.name,
          Slug: p.slug,
          'Product Type': 'SIMPLE',
          Category: categoryName,
          'Parent Category': parentName,
          'Category Brand': categoryBrand,
          'Storage ID': '',
          Size: '',
          'Unit ID': '',
          Color: '',
          Stock: p.stock ?? 0,
          'Base Price': basePrice,
          'Sale %': p.sale ?? '',
          'Sale End Date': p.saleEndDate ? new Date(p.saleEndDate).toISOString().slice(0, 10) : '',
          'Price After Sale': priceAfterSale,
          'Tax Status': '',
          'Tax Type': '',
          'Tax Amount': '',
          'Tax %': '',
          'Calculated Price': priceAfterSale,
          'Image URLs': imageUrls,
          Featured: p.featured ? 'Yes' : 'No',
        });
      }
    } else {
      for (const storage of p.storages) {
        const basePrice = Number(storage.price);
        const salePct = storage.salePercentage != null ? Number(storage.salePercentage) : null;
        const saleEnd = storage.saleEndDate ?? null;

        for (const unit of storage.units) {
          const priceAfterSale =
            salePct != null && saleEnd && new Date(saleEnd) > new Date()
              ? basePrice - (basePrice * salePct) / 100
              : basePrice;
          const calculatedPrice = getUnitCalculatedPrice(
            basePrice,
            salePct,
            saleEnd,
            unit
          );

          rows.push({
            'Product ID': p.id,
            'Product Name': p.name,
            Slug: p.slug,
            'Product Type': 'STORAGE',
            Category: categoryName,
            'Parent Category': parentName,
            'Category Brand': categoryBrand,
            'Storage ID': storage.id,
            Size: storage.size,
            'Unit ID': unit.id,
            Color: unit.color,
            Stock: unit.stock,
            'Base Price': basePrice,
            'Sale %': storage.salePercentage ?? '',
            'Sale End Date': storage.saleEndDate
              ? new Date(storage.saleEndDate).toISOString().slice(0, 10)
              : '',
            'Price After Sale': priceAfterSale,
            'Tax Status': unit.taxStatus,
            'Tax Type': unit.taxType,
            'Tax Amount':
              unit.taxType === 'FIXED' && unit.taxAmount != null ? Number(unit.taxAmount) : '',
            'Tax %':
              unit.taxType === 'PERCENTAGE' && unit.taxPercentage != null
                ? Number(unit.taxPercentage)
                : '',
            'Calculated Price': calculatedPrice,
            'Image URLs': imageUrls,
            Featured: p.featured ? 'Yes' : 'No',
          });
        }
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const outPath = path.join(process.cwd(), 'products-export.xlsx');
  XLSX.writeFile(wb, outPath);

  console.log(`✅ Exported ${rows.length} rows to ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

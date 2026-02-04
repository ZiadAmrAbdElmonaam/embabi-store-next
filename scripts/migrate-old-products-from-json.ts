/**
 * Migration script: Import old product data from JSON files into the new schema.
 *
 * Transforms:
 * - ProductStorage (old: has stock) + ProductStorageVariant (color, quantity)
 *   → ProductStorage (no stock) + ProductStorageUnit (color, stock, taxStatus, taxType, taxAmount)
 *
 * - Tax info is parsed from the old "size" string (Arabic keywords):
 *   - مدفوع / خالص / paid → PAID
 *   - غير مدفوع / عليه ضريبه / unpaid → UNPAID, extract tax amount from (number)
 *
 * Prerequisites:
 * 1. New schema must be applied (prisma migrate deploy)
 * 2. Product tables should be empty or you're OK with duplicates
 * 3. Categories must exist (categoryId references)
 *
 * Run: npm run migrate-old-products
 * Dry run: npm run migrate-old-products -- --dry-run
 * Clear first: npm run migrate-old-products -- --clear  (deletes products & categories in dev before migrating)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const JSONS_DIR = path.join(process.cwd(), 'public', 'jsons');

type OldProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  images: string[];
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  discountPrice: string | null;
  featured: boolean;
  sale: number | null;
  saleEndDate: string | null;
  salePrice: number | null;
  thumbnails: string[];
};

type OldProductStorage = {
  id: string;
  productId: string;
  size: string;
  price: string;
  stock: number;
  salePercentage: number | null;
  saleEndDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type OldProductStorageVariant = {
  id: string;
  storageId: string;
  color: string;
  quantity: number;
};

type OldProductVariant = {
  id: string;
  color: string;
  quantity: number;
  productId: string;
};

type OldProductDetail = {
  id: string;
  label: string;
  description: string;
  productId: string;
};

type OldCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  image: string | null;
  parentId: string | null;
  brand: string | null;
};

/** Parse tax info from old size string (e.g. "512gb غير مدفوع ضريبه (3450)") */
function parseTaxFromSize(size: string): {
  taxStatus: 'PAID' | 'UNPAID';
  taxAmount: number | null;
  taxType: 'FIXED' | 'PERCENTAGE';
} {
  const s = size.toLowerCase();
  // PAID indicators: مدفوع, خالص, paid
  const isPaid =
    s.includes('مدفوع') ||
    s.includes('خالص') ||
    s.includes('مدفوع الضريبة') ||
    s.includes('مدفوع الضريبه');
  // UNPAID indicators: غير مدفوع, عليه ضريبه, علية ضريبة
  const isUnpaid =
    s.includes('غير مدفوع') ||
    s.includes('عليه ضريبه') ||
    s.includes('علية ضريبة') ||
    s.includes('علية ضريبه') ||
    s.includes('عليه ضريبة');
  // Extract number from parentheses: (3450), (7990), (10,300)
  const match = size.match(/\(([\d,.\s]+)\)/);
  let taxAmount: number | null = null;
  if (match) {
    taxAmount = parseFloat(match[1].replace(/,/g, '').trim()) || null;
  }
  return {
    taxStatus: isPaid ? 'PAID' : isUnpaid ? 'UNPAID' : 'UNPAID',
    taxAmount: taxAmount ?? (isPaid ? 0 : null),
    taxType: 'FIXED',
  };
}

function loadJson<T>(filename: string): T {
  const filePath = path.join(JSONS_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const shouldClear = process.argv.includes('--clear');
  if (isDryRun) {
    console.log('📦 DRY RUN - No changes will be written to the database.\n');
  }
  console.log('📦 Migrating old product data from JSON...\n');

  if (shouldClear && !isDryRun) {
    console.log('🗑 Clearing existing products and categories...');
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log('✓ Cleared.\n');
  }

  // Step 1: Migrate categories first
  let categoriesCreated = 0;
  try {
    const categories = loadJson<OldCategory[]>('Category.json');
    const categoryIds = new Set(categories.map((c) => c.id));
    const insertedIds = new Set<string>();

    const sortCategories = (list: OldCategory[]): OldCategory[] => {
      const sorted: OldCategory[] = [];
      let remaining = [...list];
      while (remaining.length > 0) {
        const batch = remaining.filter(
          (c) =>
            c.parentId == null ||
            (categoryIds.has(c.parentId) && insertedIds.has(c.parentId))
        );
        if (batch.length === 0) break;
        for (const c of batch) {
          sorted.push(c);
          insertedIds.add(c.id);
        }
        remaining = remaining.filter((c) => !insertedIds.has(c.id));
      }
      return sorted.length === list.length ? sorted : list;
    };

    const sortedCategories = sortCategories(categories);

    for (const c of sortedCategories) {
      if (!isDryRun) {
        const exists = await prisma.category.findUnique({ where: { id: c.id } });
        if (exists) continue;
      }

      if (!isDryRun) {
        await prisma.category.create({
          data: {
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description ?? undefined,
            image: c.image ?? undefined,
            parentId: c.parentId ?? undefined,
            brand: c.brand ?? undefined,
          },
        });
      }
      categoriesCreated++;
    }
    console.log(`✓ Categories migrated: ${categoriesCreated}\n`);
  } catch (e) {
    console.warn('   Category.json not found or invalid, skipping categories:', (e as Error).message);
  }

  // Step 2: Migrate products
  const products = loadJson<OldProduct[]>('Product.json');
  const storages = loadJson<OldProductStorage[]>('ProductStorage.json');
  const storageVariants = loadJson<OldProductStorageVariant[]>('ProductStorageVariant.json');
  const productVariants = loadJson<OldProductVariant[]>('ProductVariant.json');
  let productDetails: OldProductDetail[] = [];
  try {
    productDetails = loadJson<OldProductDetail[]>('ProductDetail.json');
  } catch {
    console.log('   (ProductDetail.json not found or empty, skipping details)');
  }

  const storageIds = new Set(storages.map((s) => s.id));
  const productsWithStorage = new Set(storages.map((s) => s.productId));

  // Build variant lookup by storageId
  const variantsByStorage = new Map<string, OldProductStorageVariant[]>();
  for (const v of storageVariants) {
    if (!variantsByStorage.has(v.storageId)) {
      variantsByStorage.set(v.storageId, []);
    }
    variantsByStorage.get(v.storageId)!.push(v);
  }

  // Build product variants by productId
  const variantsByProduct = new Map<string, OldProductVariant[]>();
  for (const v of productVariants) {
    if (!variantsByProduct.has(v.productId)) {
      variantsByProduct.set(v.productId, []);
    }
    variantsByProduct.get(v.productId)!.push(v);
  }

  const detailsByProduct = new Map<string, OldProductDetail[]>();
  for (const d of productDetails) {
    if (!detailsByProduct.has(d.productId)) {
      detailsByProduct.set(d.productId, []);
    }
    detailsByProduct.get(d.productId)!.push(d);
  }

  let productsCreated = 0;
  let productsSkipped = 0;
  let storagesCreated = 0;
  let unitsCreated = 0;

  for (const p of products) {
    const existing = !isDryRun
      ? await prisma.product.findUnique({
          where: { id: p.id },
          include: { storages: { include: { units: true } } },
        })
      : null;
    if (existing) {
      productsSkipped++;
      continue;
    }

    if (!isDryRun) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: p.categoryId },
      });
      if (!categoryExists) {
        console.warn(`⚠ Skipping product ${p.slug}: category ${p.categoryId} not found`);
        productsSkipped++;
        continue;
      }
    }

    const isStorageProduct = productsWithStorage.has(p.id);
    const productStorages = storages.filter((s) => s.productId === p.id);

    if (!isDryRun) {
      await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        productType: isStorageProduct ? 'STORAGE' : 'SIMPLE',
        price: isStorageProduct ? null : parseFloat(p.price),
        stock: isStorageProduct ? null : p.stock,
        images: p.images ?? [],
        thumbnails: p.thumbnails ?? [],
        categoryId: p.categoryId,
        discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : null,
        featured: p.featured ?? false,
        sale: p.sale,
        saleEndDate: p.saleEndDate ? new Date(p.saleEndDate) : null,
        salePrice: p.salePrice,
        variants: isStorageProduct
          ? undefined
          : {
              create: (variantsByProduct.get(p.id) ?? []).map((v) => ({
                id: v.id,
                color: v.color,
                quantity: v.quantity,
              })),
            },
        details: {
          create: (detailsByProduct.get(p.id) ?? []).map((d) => ({
            id: d.id,
            label: d.label,
            description: d.description,
          })),
        },
        storages:
          productStorages.length > 0
            ? {
                create: productStorages.map((s) => {
                  const variants = variantsByStorage.get(s.id) ?? [];
                  const taxInfo = parseTaxFromSize(s.size);
                  const unitsToCreate =
                    variants.length > 0
                      ? variants.map((v) => {
                          const tax = parseTaxFromSize(s.size);
                          return {
                            color: v.color,
                            stock: v.quantity,
                            taxStatus: tax.taxStatus,
                            taxType: tax.taxType,
                            taxAmount: tax.taxAmount != null ? tax.taxAmount : undefined,
                          };
                        })
                      : [
                          {
                            color: 'Default',
                            stock: s.stock,
                            taxStatus: taxInfo.taxStatus,
                            taxType: taxInfo.taxType,
                            taxAmount: taxInfo.taxAmount != null ? taxInfo.taxAmount : undefined,
                          },
                        ];
                  return {
                    id: s.id,
                    size: s.size,
                    price: parseFloat(s.price),
                    salePercentage: s.salePercentage,
                    saleEndDate: s.saleEndDate ? new Date(s.saleEndDate) : null,
                    units: {
                      create: unitsToCreate,
                    },
                  };
                }),
              }
            : undefined,
      },
    });
    }

    productsCreated++;
    if (productStorages.length > 0) {
      storagesCreated += productStorages.length;
      for (const s of productStorages) {
        const variants = variantsByStorage.get(s.id) ?? [];
        unitsCreated += variants.length > 0 ? variants.length : 1;
      }
    }
  }

  console.log(`✅ Migration complete:`);
  console.log(`   Products created: ${productsCreated}`);
  console.log(`   Products skipped (already exist): ${productsSkipped}`);
  console.log(`   Storages created: ${storagesCreated}`);
  console.log(`   Units created: ${unitsCreated}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

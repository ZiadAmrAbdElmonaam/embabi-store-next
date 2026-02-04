/**
 * Fill ProductStorageUnit rows for existing ProductStorage rows in production DB.
 *
 * Reads ProductStorage.json and ProductStorageVariant.json from public/jsons/
 * For each ProductStorage that exists in DB (by id):
 *   - If ProductStorageVariant exists → creates one unit per variant (color + quantity)
 *   - If no variants → creates one "Default" unit with stock from ProductStorage.stock
 *   - Parses tax info from size string (Arabic keywords)
 *
 * Prerequisites:
 * 1. ProductStorage rows must already exist in production DB (same ids as JSON)
 * 2. ProductStorageUnit table should be empty (or script will skip existing units)
 *
 * Run: npm run fill-product-storage-units
 * Dry run: npm run fill-product-storage-units -- --dry-run
 *
 * IMPORTANT: Make sure DATABASE_URL points to PRODUCTION before running!
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const JSONS_DIR = path.join(process.cwd(), 'public', 'jsons');

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
  if (isDryRun) {
    console.log('📦 DRY RUN - No changes will be written to the database.\n');
  }

  console.log('📦 Filling ProductStorageUnit rows for existing ProductStorage...\n');
  console.log('⚠️  WARNING: Make sure DATABASE_URL points to PRODUCTION!\n');

  // Load JSON data
  const storages = loadJson<OldProductStorage[]>('ProductStorage.json');
  const storageVariants = loadJson<OldProductStorageVariant[]>('ProductStorageVariant.json');

  // Build variant lookup by storageId
  const variantsByStorage = new Map<string, OldProductStorageVariant[]>();
  for (const v of storageVariants) {
    if (!variantsByStorage.has(v.storageId)) {
      variantsByStorage.set(v.storageId, []);
    }
    variantsByStorage.get(v.storageId)!.push(v);
  }

  let storagesProcessed = 0;
  let storagesSkipped = 0;
  let unitsCreated = 0;
  let unitsSkipped = 0;

  for (const storage of storages) {
    // Check if ProductStorage exists in DB
    const existingStorage = !isDryRun
      ? await prisma.productStorage.findUnique({
          where: { id: storage.id },
          include: { units: true },
        })
      : null;

    if (!existingStorage) {
      storagesSkipped++;
      console.log(`⚠️  Skipping storage ${storage.id}: not found in DB`);
      continue;
    }

    // Skip if units already exist
    if (existingStorage.units.length > 0) {
      storagesSkipped++;
      console.log(`⏭️  Skipping storage ${storage.id}: already has ${existingStorage.units.length} units`);
      continue;
    }

    const variants = variantsByStorage.get(storage.id) ?? [];
    const taxInfo = parseTaxFromSize(storage.size);

    // Create units: one per variant, or one "Default" if no variants
    const unitsToCreate =
      variants.length > 0
        ? variants.map((v) => ({
            color: v.color,
            stock: v.quantity,
            taxStatus: taxInfo.taxStatus,
            taxType: taxInfo.taxType,
            taxAmount: taxInfo.taxAmount != null ? taxInfo.taxAmount : undefined,
          }))
        : [
            {
              color: 'Default',
              stock: storage.stock,
              taxStatus: taxInfo.taxStatus,
              taxType: taxInfo.taxType,
              taxAmount: taxInfo.taxAmount != null ? taxInfo.taxAmount : undefined,
            },
          ];

    if (!isDryRun) {
      await prisma.productStorageUnit.createMany({
        data: unitsToCreate.map((u) => ({
          storageId: storage.id,
          color: u.color,
          stock: u.stock,
          taxStatus: u.taxStatus,
          taxType: u.taxType,
          taxAmount: u.taxAmount != null ? u.taxAmount : null,
          taxPercentage: null,
        })),
        skipDuplicates: true,
      });
    }

    storagesProcessed++;
    unitsCreated += unitsToCreate.length;

    console.log(
      `✓ Storage ${storage.id}: Created ${unitsToCreate.length} unit(s) ` +
        `(${variants.length > 0 ? `${variants.length} variants` : 'Default'})`
    );
  }

  console.log(`\n✅ Complete:`);
  console.log(`   Storages processed: ${storagesProcessed}`);
  console.log(`   Storages skipped: ${storagesSkipped}`);
  console.log(`   Units created: ${unitsCreated}`);
  if (isDryRun) {
    console.log(`\n⚠️  This was a DRY RUN - no changes were made.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Seed script: Test Products for All Cases & Edge Cases
 *
 * Creates products covering:
 * - SIMPLE: no colors, with colors, with/without sale, sale expired, stock edge cases
 * - STORAGE: PAID/UNPAID, FIXED/PERCENTAGE tax, single/multiple storages, sale, 0 stock
 *
 * Run: npx ts-node -T scripts/seed-test-products.ts
 * Or: npm run seed-test-products
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to create unique slug
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureCategory(name: string, slug: string) {
  const cat = await prisma.category.findFirst({ where: { slug } });
  if (cat) return cat;
  return prisma.category.create({ data: { name, slug, description: `Category for ${name}` } });
}

async function main() {
  console.log('🌱 Seeding test products...\n');

  const category = await ensureCategory('Test Products', 'test-products');
  const baseSlug = (n: string) => `${slugify(n)}-${Date.now().toString(36)}`;

  // ============ SIMPLE PRODUCTS ============

  // 1. Simple - no colors, no sale
  await prisma.product.create({
    data: {
      name: '[TEST] Simple - No Colors No Sale',
      slug: baseSlug('test-simple-no-colors-no-sale'),
      description: '<p>Simple product with no color variants and no sale.</p>',
      productType: 'SIMPLE',
      price: 100,
      stock: 50,
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  console.log('✓ [TEST] Simple - No Colors No Sale');

  // 2. Simple - no colors, with sale (active)
  const saleEndFuture = new Date();
  saleEndFuture.setDate(saleEndFuture.getDate() + 7);
  await prisma.product.create({
    data: {
      name: '[TEST] Simple - No Colors With Sale',
      slug: baseSlug('test-simple-no-colors-sale'),
      description: '<p>Simple product with active sale (10% off).</p>',
      productType: 'SIMPLE',
      price: 200,
      stock: 30,
      sale: 10,
      saleEndDate: saleEndFuture,
      salePrice: 180,
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  console.log('✓ [TEST] Simple - No Colors With Sale');

  // 3. Simple - sale expired
  const saleEndPast = new Date();
  saleEndPast.setDate(saleEndPast.getDate() - 1);
  await prisma.product.create({
    data: {
      name: '[TEST] Simple - Sale Expired',
      slug: baseSlug('test-simple-sale-expired'),
      description: '<p>Simple product with expired sale (edge case).</p>',
      productType: 'SIMPLE',
      price: 150,
      stock: 20,
      sale: 20,
      saleEndDate: saleEndPast,
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  console.log('✓ [TEST] Simple - Sale Expired');

  // 4. Simple - with color variants
  const simpleColors = await prisma.product.create({
    data: {
      name: '[TEST] Simple - With Color Variants',
      slug: baseSlug('test-simple-colors'),
      description: '<p>Simple product with multiple color variants.</p>',
      productType: 'SIMPLE',
      price: 120,
      stock: 25,
      categoryId: category.id,
      images: [],
      thumbnails: [],
      variants: {
        create: [
          { color: 'Black', quantity: 10 },
          { color: 'White', quantity: 8 },
          { color: 'Blue', quantity: 7 },
        ],
      },
    },
  });
  console.log('✓ [TEST] Simple - With Color Variants');

  // 5. Simple - colors + sale (15% off: 300 -> 255)
  await prisma.product.create({
    data: {
      name: '[TEST] Simple - Colors + Sale',
      slug: baseSlug('test-simple-colors-sale'),
      description: '<p>Simple product with colors and active sale.</p>',
      productType: 'SIMPLE',
      price: 300,
      salePrice: 255,
      stock: 15,
      sale: 15,
      saleEndDate: saleEndFuture,
      categoryId: category.id,
      images: [],
      thumbnails: [],
      variants: {
        create: [
          { color: 'Red', quantity: 5 },
          { color: 'Green', quantity: 10 },
        ],
      },
    },
  });
  console.log('✓ [TEST] Simple - Colors + Sale');

  // 6. Simple - out of stock (edge case)
  await prisma.product.create({
    data: {
      name: '[TEST] Simple - Out of Stock',
      slug: baseSlug('test-simple-out-of-stock'),
      description: '<p>Simple product with 0 stock (edge case).</p>',
      productType: 'SIMPLE',
      price: 99,
      stock: 0,
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  console.log('✓ [TEST] Simple - Out of Stock');

  // 7. Simple - decimal price
  await prisma.product.create({
    data: {
      name: '[TEST] Simple - Decimal Price',
      slug: baseSlug('test-simple-decimal'),
      description: '<p>Simple product with decimal price.</p>',
      productType: 'SIMPLE',
      price: 49.99,
      stock: 100,
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  console.log('✓ [TEST] Simple - Decimal Price');

  // ============ STORAGE PRODUCTS ============

  // 8. Storage - PAID unit only, FIXED tax
  const storage1 = await prisma.productStorage.create({
    data: {
      productId: (
        await prisma.product.create({
          data: {
            name: '[TEST] Storage - PAID Fixed Tax',
            slug: baseSlug('test-storage-paid-fixed'),
            description: '<p>Storage product, PAID unit with fixed tax.</p>',
            productType: 'STORAGE',
            categoryId: category.id,
            images: [],
            thumbnails: [],
          },
        })
      ).id,
      size: '128GB',
      price: 500,
    },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage1.id,
      color: 'Black',
      stock: 10,
      taxStatus: 'PAID',
      taxType: 'FIXED',
      taxAmount: 50,
    },
  });
  console.log('✓ [TEST] Storage - PAID Fixed Tax');

  // 9. Storage - PAID unit, PERCENTAGE tax
  const storage2 = await prisma.productStorage.create({
    data: {
      productId: (
        await prisma.product.create({
          data: {
            name: '[TEST] Storage - PAID Percentage Tax',
            slug: baseSlug('test-storage-paid-pct'),
            description: '<p>Storage product, PAID unit with percentage tax.</p>',
            productType: 'STORAGE',
            categoryId: category.id,
            images: [],
            thumbnails: [],
          },
        })
      ).id,
      size: '256GB',
      price: 600,
    },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage2.id,
      color: 'White',
      stock: 5,
      taxStatus: 'PAID',
      taxType: 'PERCENTAGE',
      taxPercentage: 10,
    },
  });
  console.log('✓ [TEST] Storage - PAID Percentage Tax');

  // 10. Storage - UNPAID unit only (no tax added)
  const storage3 = await prisma.productStorage.create({
    data: {
      productId: (
        await prisma.product.create({
          data: {
            name: '[TEST] Storage - UNPAID Only',
            slug: baseSlug('test-storage-unpaid'),
            description: '<p>Storage product, UNPAID unit (no tax added to price).</p>',
            productType: 'STORAGE',
            categoryId: category.id,
            images: [],
            thumbnails: [],
          },
        })
      ).id,
      size: '64GB',
      price: 400,
    },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage3.id,
      color: 'Blue',
      stock: 8,
      taxStatus: 'UNPAID',
      taxType: 'FIXED',
      taxAmount: 0,
    },
  });
  console.log('✓ [TEST] Storage - UNPAID Only');

  // 11. Storage - Mixed PAID + UNPAID (same color)
  const prod4 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Mixed PAID and UNPAID',
      slug: baseSlug('test-storage-mixed'),
      description: '<p>Storage with Black PAID and Black UNPAID (same color, different tax).</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage4 = await prisma.productStorage.create({
    data: { productId: prod4.id, size: '128GB', price: 550 },
  });
  await prisma.productStorageUnit.createMany({
    data: [
      { storageId: storage4.id, color: 'Black', stock: 3, taxStatus: 'PAID', taxType: 'FIXED', taxAmount: 55 },
      { storageId: storage4.id, color: 'Black', stock: 7, taxStatus: 'UNPAID', taxType: 'FIXED', taxAmount: 0 },
    ],
  });
  console.log('✓ [TEST] Storage - Mixed PAID and UNPAID');

  // 12. Storage - with sale
  const prod5 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - With Sale',
      slug: baseSlug('test-storage-sale'),
      description: '<p>Storage product with active sale (20% off base).</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage5 = await prisma.productStorage.create({
    data: {
      productId: prod5.id,
      size: '256GB',
      price: 800,
      salePercentage: 20,
      saleEndDate: saleEndFuture,
    },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage5.id,
      color: 'Gold',
      stock: 4,
      taxStatus: 'PAID',
      taxType: 'FIXED',
      taxAmount: 80,
    },
  });
  console.log('✓ [TEST] Storage - With Sale');

  // 13. Storage - sale expired
  const prod6 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Sale Expired',
      slug: baseSlug('test-storage-sale-expired'),
      description: '<p>Storage with expired sale (edge case).</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage6 = await prisma.productStorage.create({
    data: {
      productId: prod6.id,
      size: '512GB',
      price: 1000,
      salePercentage: 15,
      saleEndDate: saleEndPast,
    },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage6.id,
      color: 'Silver',
      stock: 2,
      taxStatus: 'PAID',
      taxType: 'PERCENTAGE',
      taxPercentage: 5,
    },
  });
  console.log('✓ [TEST] Storage - Sale Expired');

  // 14. Storage - multiple storages (128GB, 256GB, 512GB)
  const prod7 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Multiple Sizes',
      slug: baseSlug('test-storage-multi'),
      description: '<p>Product with multiple storage options.</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  for (const [size, price] of [['128GB', 450], ['256GB', 550], ['512GB', 700]]) {
    const s = await prisma.productStorage.create({
      data: { productId: prod7.id, size, price: Number(price) },
    });
    await prisma.productStorageUnit.create({
      data: {
        storageId: s.id,
        color: 'Black',
        stock: 5,
        taxStatus: 'PAID',
        taxType: 'FIXED',
        taxAmount: Number(price) * 0.1,
      },
    });
  }
  console.log('✓ [TEST] Storage - Multiple Sizes');

  // 15. Storage - unit with 0 stock (edge case)
  const prod8 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Unit Out of Stock',
      slug: baseSlug('test-storage-unit-oos'),
      description: '<p>Storage with one unit out of stock.</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage8 = await prisma.productStorage.create({
    data: { productId: prod8.id, size: '128GB', price: 350 },
  });
  await prisma.productStorageUnit.createMany({
    data: [
      { storageId: storage8.id, color: 'Black', stock: 0, taxStatus: 'UNPAID', taxType: 'FIXED', taxAmount: 0 },
      { storageId: storage8.id, color: 'White', stock: 3, taxStatus: 'PAID', taxType: 'FIXED', taxAmount: 35 },
    ],
  });
  console.log('✓ [TEST] Storage - Unit Out of Stock');

  // 16. Storage - multiple colors per storage
  const prod9 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Multiple Colors',
      slug: baseSlug('test-storage-multi-colors'),
      description: '<p>Storage with multiple color units.</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage9 = await prisma.productStorage.create({
    data: { productId: prod9.id, size: '256GB', price: 650 },
  });
  await prisma.productStorageUnit.createMany({
    data: [
      { storageId: storage9.id, color: 'Black', stock: 5, taxStatus: 'PAID', taxType: 'FIXED', taxAmount: 65 },
      { storageId: storage9.id, color: 'White', stock: 4, taxStatus: 'PAID', taxType: 'FIXED', taxAmount: 65 },
      { storageId: storage9.id, color: 'Blue', stock: 2, taxStatus: 'UNPAID', taxType: 'FIXED', taxAmount: 0 },
    ],
  });
  console.log('✓ [TEST] Storage - Multiple Colors');

  // 17. Storage - PAID with 0 tax (edge case)
  const prod10 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - PAID Zero Tax',
      slug: baseSlug('test-storage-paid-zero'),
      description: '<p>PAID unit with 0 tax amount (duties waived).</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage10 = await prisma.productStorage.create({
    data: { productId: prod10.id, size: '64GB', price: 299 },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage10.id,
      color: 'Gray',
      stock: 10,
      taxStatus: 'PAID',
      taxType: 'FIXED',
      taxAmount: 0,
    },
  });
  console.log('✓ [TEST] Storage - PAID Zero Tax');

  // 18. Storage - large stock
  const prod11 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Large Stock',
      slug: baseSlug('test-storage-large-stock'),
      description: '<p>Storage with large stock values.</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage11 = await prisma.productStorage.create({
    data: { productId: prod11.id, size: '128GB', price: 199 },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage11.id,
      color: 'Black',
      stock: 999,
      taxStatus: 'PAID',
      taxType: 'FIXED',
      taxAmount: 19.99,
    },
  });
  console.log('✓ [TEST] Storage - Large Stock');

  // 19. Storage - all units 0 stock (fully out of stock)
  const prod12 = await prisma.product.create({
    data: {
      name: '[TEST] Storage - Fully Out of Stock',
      slug: baseSlug('test-storage-fully-oos'),
      description: '<p>Storage product with all units at 0 stock.</p>',
      productType: 'STORAGE',
      categoryId: category.id,
      images: [],
      thumbnails: [],
    },
  });
  const storage12 = await prisma.productStorage.create({
    data: { productId: prod12.id, size: '128GB', price: 500 },
  });
  await prisma.productStorageUnit.create({
    data: {
      storageId: storage12.id,
      color: 'Black',
      stock: 0,
      taxStatus: 'UNPAID',
      taxType: 'FIXED',
      taxAmount: 0,
    },
  });
  console.log('✓ [TEST] Storage - Fully Out of Stock');

  // 20. Featured product (for homepage)
  await prisma.product.updateMany({
    where: { slug: { contains: 'test-simple-no-colors-sale' } },
    data: { featured: true },
  });
  console.log('✓ [TEST] Marked one product as featured');

  console.log('\n✅ All 20 test products created successfully!');
  console.log('\nTest cases covered:');
  console.log('  SIMPLE: no colors, with colors, sale active/expired, out of stock, decimal price');
  console.log('  STORAGE: PAID/UNPAID, FIXED/PERCENTAGE tax, mixed, sale, multi-size, multi-color');
  console.log('  EDGE: 0 stock, sale expired, PAID with 0 tax');
  console.log('\nView in admin: /admin/products');
  console.log('Delete test products: npx ts-node -T scripts/delete-test-products.ts');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

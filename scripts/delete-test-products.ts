/**
 * Delete all [TEST] products and the Test Products category
 *
 * Run: npx ts-node -T scripts/delete-test-products.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting test products...\n');

  const deleted = await prisma.product.deleteMany({
    where: {
      name: { contains: '[TEST]' },
    },
  });

  console.log(`✓ Deleted ${deleted.count} test products`);

  // Optionally delete the Test Products category if it has no other products
  const testCat = await prisma.category.findFirst({
    where: { slug: 'test-products' },
    include: { _count: { select: { products: true } } },
  });
  if (testCat && testCat._count.products === 0) {
    await prisma.category.delete({ where: { id: testCat.id } });
    console.log('✓ Deleted empty "Test Products" category');
  }

  console.log('\n✅ Done');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

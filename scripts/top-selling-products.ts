/**
 * Top selling products:
 * 1) From paid/successful orders only (paymentStatus = SUCCESS)
 * 2) From all orders regardless of status (by user orders)
 *
 * Run: npx ts-node -T scripts/top-selling-products.ts
 * Or:  npm run top-selling-products
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Top selling product names from PAID orders only (paymentStatus = SUCCESS)
  const paidOrderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: { paymentStatus: 'SUCCESS' },
      status: 'ACTIVE',
    },
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 20,
  });

  const productIdsPaid = paidOrderItems.map((i) => i.productId);
  const productsPaid = await prisma.product.findMany({
    where: { id: { in: productIdsPaid } },
    select: { id: true, name: true, slug: true },
  });
  const productMapPaid = new Map(productsPaid.map((p) => [p.id, p]));

  console.log('\n=== Top selling products (from PAID orders only) ===\n');
  paidOrderItems.forEach((item, i) => {
    const product = productMapPaid.get(item.productId);
    const name = product?.name ?? 'Unknown';
    const totalQty = item._sum.quantity ?? 0;
    const orderCount = item._count.id;
    console.log(`${i + 1}. ${name}`);
    console.log(`   Quantity sold: ${totalQty}  |  Orders: ${orderCount}\n`);
  });

  // 2) Top selling product names from ALL orders (any status - by user orders)
  const allOrderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {},
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 20,
  });

  const productIdsAll = allOrderItems.map((i) => i.productId);
  const productsAll = await prisma.product.findMany({
    where: { id: { in: productIdsAll } },
    select: { id: true, name: true, slug: true },
  });
  const productMapAll = new Map(productsAll.map((p) => [p.id, p]));

  console.log('\n=== Top selling products (ALL orders, any status) ===\n');
  allOrderItems.forEach((item, i) => {
    const product = productMapAll.get(item.productId);
    const name = product?.name ?? 'Unknown';
    const totalQty = item._sum.quantity ?? 0;
    const orderCount = item._count.id;
    console.log(`${i + 1}. ${name}`);
    console.log(`   Quantity ordered: ${totalQty}  |  Order lines: ${orderCount}\n`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

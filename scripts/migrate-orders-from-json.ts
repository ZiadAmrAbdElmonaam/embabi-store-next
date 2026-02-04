/**
 * Migration script: Import Order and OrderItem data from JSON files.
 *
 * Does NOT skip anything: creates placeholder Users/Products for missing references.
 *
 * Prerequisites:
 * 1. At least one Category must exist (or script creates "Migrated" category)
 * 2. JSON files: public/jsons/Order.json, OrderItem.json, StatusUpdate.json
 *
 * Run: npm run migrate-orders
 * Dry run: npm run migrate-orders -- --dry-run
 * Clear first: npm run migrate-orders -- --clear  (deletes orders, order items, status updates)
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const JSONS_DIR = path.join(process.cwd(), 'public', 'jsons');

type OldOrder = {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  trnxId: string | null;
  total: string | number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNotes?: string | null;
  paymentProof?: string | null;
  createdAt: string;
  updatedAt: string;
  couponId?: string | null;
  discountAmount?: string | number | null;
};

type OldOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string | number;
  color?: string | null;
  storageId?: string | null;
  unitId?: string | null;
  status?: string | null;
};

type OldStatusUpdate = {
  id: string;
  orderId: string;
  status: string;
  comment?: string | null;
  createdAt: string;
};

function loadJson<T>(filename: string): T[] {
  const filePath = path.join(JSONS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${filename} not found at ${filePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`❌ Invalid JSON in ${filename}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const clear = args.includes('--clear');

  if (dryRun) console.log('🔍 DRY RUN - no changes will be made\n');

  // Load JSONs
  const orders = loadJson<OldOrder>('Order.json');
  const orderItems = loadJson<OldOrderItem>('OrderItem.json');
  const statusUpdates = loadJson<OldStatusUpdate>('StatusUpdate.json');

  console.log(`📦 Loaded: ${orders.length} orders, ${orderItems.length} order items, ${statusUpdates.length} status updates\n`);

  if (orders.length === 0) {
    console.log('No orders to migrate.');
    return;
  }

  // Clear existing data if requested
  if (clear && !dryRun) {
    console.log('🗑️  Clearing existing orders, order items, status updates...');
    await prisma.statusUpdate.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    console.log('   Done.\n');
  } else if (clear && dryRun) {
    console.log('🗑️  [DRY RUN] Would clear existing orders, order items, status updates\n');
  }

  // Pre-fetch existing users, products, coupons
  const existingUserIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
  const existingProductIds = new Set((await prisma.product.findMany({ select: { id: true } })).map((p) => p.id));
  const couponIds = new Set((await prisma.coupon.findMany({ select: { id: true } })).map((c) => c.id));

  // Collect missing userIds and productIds
  const allUserIds = new Set(orders.map((o) => o.userId));
  const allProductIds = new Set(orderItems.map((i) => i.productId));
  const missingUserIds = [...allUserIds].filter((id) => !existingUserIds.has(id));
  const missingProductIds = [...allProductIds].filter((id) => !existingProductIds.has(id));

  // Create placeholder users for missing userIds
  if (!dryRun && missingUserIds.length > 0) {
    console.log(`👤 Creating ${missingUserIds.length} placeholder users...`);
    const placeholderPassword = await hash('migrated-placeholder', 10);
    for (const uid of missingUserIds) {
      try {
        await prisma.user.create({
          data: {
            id: uid,
            email: `placeholder-${uid}@migrated.local`,
            password: placeholderPassword,
            name: 'Migrated User',
          },
        });
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
          // Already exists
        } else throw e;
      }
    }
    console.log('   Done.\n');
  }

  // Get or create a category for placeholder products
  let placeholderCategoryId: string;
  const firstCategory = await prisma.category.findFirst({ select: { id: true } });
  if (firstCategory) {
    placeholderCategoryId = firstCategory.id;
  } else if (!dryRun) {
    const cat = await prisma.category.create({
      data: { name: 'Migrated', slug: 'migrated' },
    });
    placeholderCategoryId = cat.id;
  } else {
    placeholderCategoryId = 'dry-run-cat';
  }

  // Create placeholder products for missing productIds
  if (!dryRun && missingProductIds.length > 0) {
    console.log(`📦 Creating ${missingProductIds.length} placeholder products...`);
    for (const pid of missingProductIds) {
      try {
        await prisma.product.create({
          data: {
            id: pid,
            name: `Migrated Product ${pid}`,
            slug: `migrated-product-${pid}`,
            description: 'Placeholder - migrated order item',
            productType: 'SIMPLE',
            categoryId: placeholderCategoryId,
            price: 0,
            stock: 0,
            images: [],
          },
        });
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
          // Already exists (slug conflict) - use unique slug
          await prisma.product.create({
            data: {
              id: pid,
              name: `Migrated Product ${pid}`,
              slug: `migrated-${pid}`,
              description: 'Placeholder - migrated order item',
              productType: 'SIMPLE',
              categoryId: placeholderCategoryId,
              price: 0,
              stock: 0,
              images: [],
            },
          });
        } else throw e;
      }
    }
    console.log('   Done.\n');
  }

  const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const validPaymentMethods = ['CASH', 'ONLINE', 'CASH_STORE_PICKUP', 'ONLINE_STORE_PICKUP'];
  const validPaymentStatuses = ['PENDING', 'SUCCESS', 'FAILED'];
  const validItemStatuses = ['ACTIVE', 'CANCELLED'];

  let ordersCreated = 0;
  let ordersSkipped = 0;
  let itemsCreated = 0;
  let itemsSkipped = 0;
  let updatesCreated = 0;

  const orderIdsCreated = new Set<string>();

  for (const o of orders) {
    // Set couponId to null if coupon doesn't exist
    const effectiveCouponId = o.couponId && couponIds.has(o.couponId) ? o.couponId : null;
    if (o.couponId && !couponIds.has(o.couponId)) {
      console.log(`ℹ Order ${o.id}: coupon ${o.couponId} not found, setting to null`);
    }
    const status = validStatuses.includes(o.status) ? o.status : 'PENDING';
    if (!validStatuses.includes(o.status)) {
      console.log(`ℹ Order ${o.id}: invalid status ${o.status}, using PENDING`);
    }
    const paymentMethod = validPaymentMethods.includes(o.paymentMethod) ? o.paymentMethod : 'CASH';
    if (!validPaymentMethods.includes(o.paymentMethod)) {
      console.log(`ℹ Order ${o.id}: invalid paymentMethod ${o.paymentMethod}, using CASH`);
    }
    const paymentStatus = validPaymentStatuses.includes(o.paymentStatus || 'PENDING') ? (o.paymentStatus as 'PENDING' | 'SUCCESS' | 'FAILED') : 'PENDING';

    if (!dryRun) {
      try {
        await prisma.order.upsert({
          where: { id: o.id },
          create: {
            id: o.id,
            userId: o.userId,
            status,
            paymentMethod,
            paymentStatus,
            trnxId: o.trnxId || null,
            total: parseFloat(String(o.total)) || 0,
            shippingName: o.shippingName || '',
            shippingPhone: o.shippingPhone || '',
            shippingAddress: o.shippingAddress || '',
            shippingCity: o.shippingCity || '',
            shippingNotes: o.shippingNotes ?? null,
            paymentProof: o.paymentProof ?? null,
            couponId: effectiveCouponId,
            discountAmount: o.discountAmount != null ? parseFloat(String(o.discountAmount)) : null,
            createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
            updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
          },
          update: {},
        });
        orderIdsCreated.add(o.id);
        ordersCreated++;
      } catch (err) {
        console.error(`❌ Failed to create order ${o.id}:`, err instanceof Error ? err.message : err);
        ordersSkipped++;
      }
    } else {
      ordersCreated++;
    }
  }

  console.log(`\n📋 Orders: ${ordersCreated} created, ${ordersSkipped} skipped\n`);

  // Order items - all orders and products exist (placeholders created if needed)
  const existingOrderIds = dryRun
    ? new Set(orders.map((o) => o.id))
    : new Set([...orderIdsCreated, ...(await prisma.order.findMany({ select: { id: true } })).map((o) => o.id)]);

  for (const item of orderItems) {
    if (!existingOrderIds.has(item.orderId)) {
      itemsSkipped++;
      continue;
    }
    const itemStatus = item.status && validItemStatuses.includes(item.status) ? item.status : 'ACTIVE';

    if (!dryRun) {
      try {
        await prisma.orderItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity || 1,
            price: parseFloat(String(item.price)) || 0,
            color: item.color ?? null,
            storageId: item.storageId ?? null,
            unitId: item.unitId ?? null,
            status: itemStatus,
          },
          update: {},
        });
        itemsCreated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // If order or product FK fails, create placeholder product and retry
        if (msg.includes('Foreign key') && msg.includes('productId')) {
          try {
            await prisma.product.create({
              data: {
                id: item.productId,
                name: `Migrated Product ${item.productId}`,
                slug: `migrated-${item.productId}`,
                description: 'Placeholder - migrated order item',
                productType: 'SIMPLE',
                categoryId: placeholderCategoryId,
                price: 0,
                stock: 0,
                images: [],
              },
            });
            await prisma.orderItem.upsert({
              where: { id: item.id },
              create: {
                id: item.id,
                orderId: item.orderId,
                productId: item.productId,
                quantity: item.quantity || 1,
                price: parseFloat(String(item.price)) || 0,
                color: item.color ?? null,
                storageId: item.storageId ?? null,
                unitId: item.unitId ?? null,
                status: itemStatus,
              },
              update: {},
            });
            itemsCreated++;
          } catch (retryErr) {
            console.error(`❌ Failed to create order item ${item.id}:`, retryErr instanceof Error ? retryErr.message : retryErr);
            itemsSkipped++;
          }
        } else {
          console.error(`❌ Failed to create order item ${item.id}:`, msg);
          itemsSkipped++;
        }
      }
    } else {
      itemsCreated++;
    }
  }

  console.log(`📋 Order items: ${itemsCreated} created, ${itemsSkipped} skipped\n`);

  // Status updates - migrate all
  for (const su of statusUpdates) {
    if (!existingOrderIds.has(su.orderId)) continue;
    const suStatus = validStatuses.includes(su.status) ? su.status : 'PENDING';

    if (!dryRun) {
      try {
        await prisma.statusUpdate.upsert({
          where: { id: su.id },
          create: {
            id: su.id,
            orderId: su.orderId,
            status: suStatus,
            comment: su.comment ?? null,
            createdAt: su.createdAt ? new Date(su.createdAt) : undefined,
          },
          update: {},
        });
        updatesCreated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('Unique constraint') && !msg.includes('P2002')) {
          console.error(`❌ Failed to create status update ${su.id}:`, msg);
        }
      }
    } else {
      updatesCreated++;
    }
  }

  console.log(`📋 Status updates: ${updatesCreated} created\n`);
  console.log('🎉 Migration completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

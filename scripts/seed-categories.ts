/**
 * Seed script: Add more categories (parent and subcategories)
 *
 * Creates diverse categories for an e-commerce store:
 * - Electronics, Fashion, Home & Garden, Sports, Beauty, Toys, etc.
 *
 * Run: npm run seed-categories
 * Or: npx ts-node -T scripts/seed-categories.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function upsertCategory(
  name: string,
  slug: string,
  options?: { parentId?: string; description?: string; image?: string; brand?: string }
) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }
  return prisma.category.create({
    data: {
      name,
      slug,
      description: options?.description ?? `Category for ${name}`,
      image: options?.image ?? null,
      parentId: options?.parentId ?? null,
      brand: options?.brand ?? null,
    },
  });
}

async function main() {
  console.log('🌱 Seeding categories...\n');

  // ============ PARENT CATEGORIES ============
  const electronics = await upsertCategory('Electronics', 'electronics');
  const fashion = await upsertCategory('Fashion', 'fashion');
  const homeGarden = await upsertCategory('Home & Garden', 'home-garden');
  const sports = await upsertCategory('Sports & Outdoors', 'sports-outdoors');
  const beauty = await upsertCategory('Beauty & Personal Care', 'beauty-personal-care');
  const toys = await upsertCategory('Toys & Games', 'toys-games');
  const books = await upsertCategory('Books & Stationery', 'books-stationery');
  const automotive = await upsertCategory('Automotive', 'automotive');
  const health = await upsertCategory('Health & Wellness', 'health-wellness');
  const baby = await upsertCategory('Baby & Kids', 'baby-kids');

  console.log('✓ Parent categories created');

  // ============ ELECTRONICS SUBCATEGORIES ============
  const electronicsChildren = [
    'Smartphones',
    'Laptops & Computers',
    'Tablets',
    'Audio & Headphones',
    'Smart Watches',
    'TV & Monitors',
    'Accessories',
    'Gaming',
  ];
  for (const name of electronicsChildren) {
    await upsertCategory(name, slugify(`electronics-${name}`), { parentId: electronics.id });
  }
  console.log(`✓ Electronics: ${electronicsChildren.length} subcategories`);

  // ============ FASHION SUBCATEGORIES ============
  const fashionChildren = [
    'Men\'s Clothing',
    'Women\'s Clothing',
    'Kids\' Clothing',
    'Shoes',
    'Bags & Accessories',
    'Jewelry',
    'Watches',
    'Sunglasses',
  ];
  for (const name of fashionChildren) {
    await upsertCategory(name, slugify(`fashion-${name}`), { parentId: fashion.id });
  }
  console.log(`✓ Fashion: ${fashionChildren.length} subcategories`);

  // ============ HOME & GARDEN SUBCATEGORIES ============
  const homeChildren = [
    'Furniture',
    'Kitchen & Dining',
    'Bedding & Bath',
    'Home Decor',
    'Garden & Outdoor',
    'Lighting',
    'Storage & Organization',
    'Tools & Hardware',
  ];
  for (const name of homeChildren) {
    await upsertCategory(name, slugify(`home-${name}`), { parentId: homeGarden.id });
  }
  console.log(`✓ Home & Garden: ${homeChildren.length} subcategories`);

  // ============ SPORTS SUBCATEGORIES ============
  const sportsChildren = [
    'Fitness Equipment',
    'Outdoor Sports',
    'Team Sports',
    'Water Sports',
    'Cycling',
    'Camping & Hiking',
    'Sports Apparel',
    'Sports Accessories',
  ];
  for (const name of sportsChildren) {
    await upsertCategory(name, slugify(`sports-${name}`), { parentId: sports.id });
  }
  console.log(`✓ Sports & Outdoors: ${sportsChildren.length} subcategories`);

  // ============ BEAUTY SUBCATEGORIES ============
  const beautyChildren = [
    'Skincare',
    'Makeup',
    'Hair Care',
    'Fragrance',
    'Personal Care',
    'Men\'s Grooming',
    'Health & Wellness',
  ];
  for (const name of beautyChildren) {
    await upsertCategory(name, slugify(`beauty-${name}`), { parentId: beauty.id });
  }
  console.log(`✓ Beauty: ${beautyChildren.length} subcategories`);

  // ============ TOYS SUBCATEGORIES ============
  const toysChildren = [
    'Action Figures',
    'Educational Toys',
    'Board Games',
    'Puzzles',
    'Outdoor Toys',
    'Baby Toys',
    'Electronics for Kids',
  ];
  for (const name of toysChildren) {
    await upsertCategory(name, slugify(`toys-${name}`), { parentId: toys.id });
  }
  console.log(`✓ Toys & Games: ${toysChildren.length} subcategories`);

  // ============ BOOKS SUBCATEGORIES ============
  const booksChildren = [
    'Fiction',
    'Non-Fiction',
    'Children\'s Books',
    'Educational',
    'Stationery',
    'Office Supplies',
    'Art Supplies',
  ];
  for (const name of booksChildren) {
    await upsertCategory(name, slugify(`books-${name}`), { parentId: books.id });
  }
  console.log(`✓ Books & Stationery: ${booksChildren.length} subcategories`);

  // ============ AUTOMOTIVE SUBCATEGORIES ============
  const automotiveChildren = [
    'Car Accessories',
    'Car Care',
    'Motorcycle',
    'RV & Camping',
    'Tools & Equipment',
    'Parts',
  ];
  for (const name of automotiveChildren) {
    await upsertCategory(name, slugify(`automotive-${name}`), { parentId: automotive.id });
  }
  console.log(`✓ Automotive: ${automotiveChildren.length} subcategories`);

  // ============ HEALTH SUBCATEGORIES ============
  const healthChildren = [
    'Vitamins & Supplements',
    'Medical Equipment',
    'First Aid',
    'Fitness & Nutrition',
    'Wellness',
  ];
  for (const name of healthChildren) {
    await upsertCategory(name, slugify(`health-${name}`), { parentId: health.id });
  }
  console.log(`✓ Health & Wellness: ${healthChildren.length} subcategories`);

  // ============ BABY SUBCATEGORIES ============
  const babyChildren = [
    'Baby Clothing',
    'Diapering',
    'Feeding',
    'Nursery',
    'Baby Gear',
    'Baby Care',
  ];
  for (const name of babyChildren) {
    await upsertCategory(name, slugify(`baby-${name}`), { parentId: baby.id });
  }
  console.log(`✓ Baby & Kids: ${babyChildren.length} subcategories`);

  const total = await prisma.category.count();
  console.log(`\n✅ Done! Total categories: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

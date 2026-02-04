/**
 * Seeds CarouselImage and HeroThumbnail from public/jsons/CarouselImage.json
 * - Adds all carousel images to the main carousel
 * - Picks first 4 images for hero thumbnails with links to website pages
 *
 * Run: npm run seed-carousel-from-json
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface CarouselImageJson {
  id: string;
  url: string;
  order: number;
  isActive?: boolean;
  linkUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Links for hero thumbnails (pages on our website)
const HERO_THUMBNAIL_LINKS = ['/products', '/deals', '/categories', '/'];

async function seedCarouselFromJson() {
  console.log('🔄 Seeding carousel from CarouselImage.json...\n');

  const jsonPath = path.join(process.cwd(), 'public', 'jsons', 'CarouselImage.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ CarouselImage.json not found at public/jsons/CarouselImage.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  let images: CarouselImageJson[];

  try {
    images = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Invalid JSON in CarouselImage.json');
    process.exit(1);
  }

  if (!Array.isArray(images) || images.length === 0) {
    console.error('❌ No images found in CarouselImage.json');
    process.exit(1);
  }

  // Deduplicate by URL, keep first occurrence, sort by order
  const uniqueByUrl = new Map<string, CarouselImageJson>();
  for (const img of images) {
    if (img?.url && !uniqueByUrl.has(img.url)) {
      uniqueByUrl.set(img.url, img);
    }
  }
  const sortedImages = [...uniqueByUrl.values()].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  try {
    // 1. Clear and seed CarouselImage
    await prisma.carouselImage.deleteMany({});
    console.log('🗑️  Cleared existing carousel images\n');

    for (let i = 0; i < sortedImages.length; i++) {
      const img = sortedImages[i];
      await prisma.carouselImage.create({
        data: {
          url: img.url,
          order: i + 1,
          isActive: img.isActive !== false,
          linkUrl: img.linkUrl ?? null,
        },
      });
      console.log(`✅ Carousel: ${img.url.substring(0, 60)}... (order ${i + 1})`);
    }

    console.log(`\n📊 Added ${sortedImages.length} carousel images\n`);

    // 2. Clear and seed HeroThumbnail (first 4 images with our links)
    await prisma.heroThumbnail.deleteMany({});
    console.log('🗑️  Cleared existing hero thumbnails\n');

    const heroImages = sortedImages.slice(0, 4);
    for (let i = 0; i < heroImages.length; i++) {
      const img = heroImages[i];
      const linkUrl = HERO_THUMBNAIL_LINKS[i] ?? '/';
      await prisma.heroThumbnail.upsert({
        where: { order: i + 1 },
        create: {
          url: img.url,
          order: i + 1,
          linkUrl,
        },
        update: {
          url: img.url,
          linkUrl,
        },
      });
      console.log(
        `✅ Hero thumbnail ${i + 1}: ${img.url.substring(0, 50)}... → ${linkUrl}`
      );
    }

    console.log('\n🎉 Seed completed!');
    console.log(`   - ${sortedImages.length} carousel images`);
    console.log(`   - ${heroImages.length} hero thumbnails with links`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCarouselFromJson()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

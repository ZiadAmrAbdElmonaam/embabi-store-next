import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateCarousel() {
  console.log('🔄 Starting carousel migration...');

  try {
    // Path to the JSON file
    const carouselConfigPath = path.join(process.cwd(), 'public', 'carousel-config.json');

    // Check if JSON file exists
    if (!fs.existsSync(carouselConfigPath)) {
      console.log('❌ No carousel-config.json file found. Skipping migration.');
      return;
    }

    // Read the JSON file
    const configData = fs.readFileSync(carouselConfigPath, 'utf-8');
    const carouselConfig = JSON.parse(configData);

    if (!carouselConfig.images || !Array.isArray(carouselConfig.images)) {
      console.log('❌ Invalid carousel config format. Skipping migration.');
      return;
    }

    console.log(`📋 Found ${carouselConfig.images.length} images to migrate`);

    // Clear existing carousel images
    await prisma.carouselImage.deleteMany({});
    console.log('🗑️ Cleared existing carousel images from database');

    // Migrate each image
    for (const image of carouselConfig.images) {
      await prisma.carouselImage.create({
        data: {
          url: image.url,
          order: image.order,
          isActive: true
        }
      });
      console.log(`✅ Migrated: ${image.url} (order: ${image.order})`);
    }

    console.log('🎉 Carousel migration completed successfully!');
    console.log(`📊 Migrated ${carouselConfig.images.length} images to database`);

    // Optionally rename the JSON file to indicate it's been migrated
    const backupPath = path.join(process.cwd(), 'public', 'carousel-config.json.backup');
    fs.renameSync(carouselConfigPath, backupPath);
    console.log('📁 Original JSON file backed up as carousel-config.json.backup');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCarousel()
  .then(() => {
    console.log('✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }); 
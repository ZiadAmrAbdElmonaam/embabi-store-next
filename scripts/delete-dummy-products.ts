import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteProduct(product: { id: string, name: string }) {
  try {
    console.log(`Attempting to delete product "${product.name}" (ID: ${product.id})...`);
    
    // Delete all OrderItems referencing the product
    const deletedOrderItems = await prisma.orderItem.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedOrderItems.count} order items`);
    
    // Delete all WishlistItems referencing the product
    const deletedWishlistItems = await prisma.wishlistItem.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedWishlistItems.count} wishlist items`);
    
    // Delete all AnonymousWishlistItems referencing the product
    const deletedAnonWishlistItems = await prisma.anonymousWishlistItem.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedAnonWishlistItems.count} anonymous wishlist items`);
    
    // Delete all CartItems referencing the product
    const deletedCartItems = await prisma.cartItem.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedCartItems.count} cart items`);
    
    // Delete all AnonymousCartItems referencing the product
    const deletedAnonCartItems = await prisma.anonymousCartItem.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedAnonCartItems.count} anonymous cart items`);
    
    // Delete all product variants
    const deletedVariants = await prisma.productVariant.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedVariants.count} product variants`);
    
    // Delete all product details
    const deletedDetails = await prisma.productDetail.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedDetails.count} product details`);
    
    // Delete all reviews for the product
    const deletedReviews = await prisma.review.deleteMany({
      where: { productId: product.id }
    });
    console.log(`  - Deleted ${deletedReviews.count} product reviews`);
    
    // Finally delete the product itself
    await prisma.product.delete({
      where: { id: product.id }
    });
    
    console.log(`Successfully deleted product "${product.name}" (ID: ${product.id})`);
    return true;
  } catch (error) {
    console.error(`Failed to delete product "${product.name}" (ID: ${product.id}):`, error);
    return false;
  }
}

async function main() {
  console.log('Starting to delete dummy products...');
  
  try {
    // 1. Delete "Summer Collection T-Shirt" product
    const summerTShirt = await prisma.product.findFirst({
      where: {
        name: 'Summer Collection T-Shirt'
      }
    });

    if (summerTShirt) {
      await deleteProduct(summerTShirt);
    } else {
      console.log('No "Summer Collection T-Shirt" product found');
    }
    
    // 2. Delete products in the "Clothing" category
    const clothingCategory = await prisma.category.findFirst({
      where: {
        name: 'Clothing'
      }
    });
    
    if (clothingCategory) {
      // Get all clothing products
      const clothingProducts = await prisma.product.findMany({
        where: {
          categoryId: clothingCategory.id
        }
      });
      
      console.log(`Found ${clothingProducts.length} products in "Clothing" category`);
      
      for (const product of clothingProducts) {
        await deleteProduct(product);
      }
    } else {
      console.log('No "Clothing" category found');
    }
    
    // 3. Delete products that contain dummy keywords
    const dummyProductsKeywords = ['test', 'dummy', 'sample', 'demo'];
    
    for (const keyword of dummyProductsKeywords) {
      const dummyProducts = await prisma.product.findMany({
        where: {
          name: {
            contains: keyword,
            mode: 'insensitive' // Case insensitive search
          }
        }
      });
      
      console.log(`Found ${dummyProducts.length} products containing "${keyword}"`);
      
      for (const product of dummyProducts) {
        await deleteProduct(product);
      }
    }
    
    console.log('Finished deleting dummy products');
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Uncaught error:', e);
    process.exit(1);
  }); 
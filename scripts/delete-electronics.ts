import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteProductsByCategory(categoryName: string) {
  try {
    console.log(`Starting deletion of all ${categoryName} products...`);
    
    // Find the category ID
    const category = await prisma.category.findFirst({
      where: { name: categoryName }
    });
    
    if (!category) {
      console.log(`No category found with name: ${categoryName}`);
      return;
    }
    
    console.log(`Found category: ${category.name} (ID: ${category.id})`);
    
    // Find all products in this category
    const products = await prisma.product.findMany({
      where: { categoryId: category.id }
    });
    
    console.log(`Found ${products.length} products in the ${categoryName} category.`);
    
    // Delete each product and its related records
    for (const product of products) {
      try {
        console.log(`\nDeleting product: ${product.name} (ID: ${product.id})...`);
        
        // 1. Delete OrderItems
        const orderItems = await prisma.orderItem.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${orderItems.count} order items`);
        
        // 2. Delete CartItems
        const cartItems = await prisma.cartItem.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${cartItems.count} cart items`);
        
        // 3. Delete AnonymousCartItems
        const anonCartItems = await prisma.anonymousCartItem.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${anonCartItems.count} anonymous cart items`);
        
        // 4. Delete WishlistItems
        const wishlistItems = await prisma.wishlistItem.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${wishlistItems.count} wishlist items`);
        
        // 5. Delete AnonymousWishlistItems
        const anonWishlistItems = await prisma.anonymousWishlistItem.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${anonWishlistItems.count} anonymous wishlist items`);
        
        // 6. Delete Reviews
        const reviews = await prisma.review.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${reviews.count} reviews`);
        
        // 7. Delete ProductVariants
        const variants = await prisma.productVariant.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${variants.count} product variants`);
        
        // 8. Delete ProductDetails
        const details = await prisma.productDetail.deleteMany({
          where: { productId: product.id }
        });
        console.log(`- Deleted ${details.count} product details`);
        
        // 9. Finally delete the Product
        await prisma.product.delete({
          where: { id: product.id }
        });
        
        console.log(`✅ Successfully deleted product: ${product.name}`);
      } catch (error) {
        console.error(`Failed to delete product ${product.name} (ID: ${product.id}):`, error);
      }
    }
    
    // Check if all products were deleted
    const remainingProducts = await prisma.product.count({
      where: { categoryId: category.id }
    });
    
    if (remainingProducts === 0) {
      // If no products left, delete the category
      console.log(`\nAttempting to delete category: ${category.name}`);
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log(`✅ Successfully deleted category: ${category.name}`);
    } else {
      console.log(`\nCannot delete category. ${remainingProducts} products still exist in this category.`);
    }
    
    console.log('\nOperation completed.');
  } catch (error) {
    console.error('Error in deletion process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
deleteProductsByCategory('Electronics')
  .catch((e) => {
    console.error('Uncaught error:', e);
    process.exit(1);
  }); 
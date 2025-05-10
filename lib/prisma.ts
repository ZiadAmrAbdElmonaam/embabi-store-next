import { PrismaClient } from "@prisma/client";

declare global {
  // We need to use var here because let/const don't work with global declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a new Prisma client instance
const prismaClient = globalThis.prisma || new PrismaClient();

// Add middleware to check for expired sales
prismaClient.$use(async (params, next) => {
  // Only run this middleware for Product operations
  if (params.model === 'Product') {
    // For admin dashboard, we want to update expired sales
    if (params.action === 'findMany' && params.args?.where?.adminDashboard) {
      // Remove the custom filter property before passing to Prisma
      delete params.args.where.adminDashboard;
      
      // First, find products with expired sales
      const now = new Date();
      
      const expiredProducts = await prismaClient.product.findMany({
        where: {
          saleEndDate: {
            lt: now
          },
          sale: {
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          saleEndDate: true
        }
      });
      
      // Update expired products if any found
      if (expiredProducts.length > 0) {
        // Update expired products to remove sale information
        await prismaClient.product.updateMany({
          where: {
            id: {
              in: expiredProducts.map(p => p.id)
            }
          },
          data: {
            sale: null,
            salePrice: null,
            saleEndDate: null
          }
        });
      }
    }
  }
  
  return next(params);
});

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismaClient;
} 
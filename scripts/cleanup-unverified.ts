import { prisma } from "@/lib/prisma";

async function cleanupUnverifiedAccounts() {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Delete unverified accounts older than 24 hours
    const result = await prisma.user.deleteMany({
      where: {
        emailVerified: false,
        createdAt: {
          lt: twentyFourHoursAgo
        }
      }
    });

    console.log(`Cleaned up ${result.count} unverified accounts older than 24 hours`);
  } catch (error) {
    console.error('Error cleaning up unverified accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupUnverifiedAccounts();
}

export { cleanupUnverifiedAccounts }; 
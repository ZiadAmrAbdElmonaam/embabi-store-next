import { PrismaClient } from "@prisma/client";

declare global {
  // We need to use var here because let/const don't work with global declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
} 
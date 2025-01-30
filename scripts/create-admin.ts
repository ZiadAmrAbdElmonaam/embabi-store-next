import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await hash('admin@123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@123' },
    update: {},
    create: {
      email: 'admin@123',
      name: 'Admin',
      password,
      role: 'ADMIN',
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
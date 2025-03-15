import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Strong password with mix of uppercase, lowercase, numbers and special characters
  const adminPassword = 'Embabi@Store#2024';
  const hashedPassword = await hash(adminPassword, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'embabistore110@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true
    },
    create: {
      email: 'embabistore110@gmail.com',
      name: 'Embabi Admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true
    },
  });

  console.log('Admin user created successfully!');
  console.log('Email:', admin.email);
  console.log('Password: Embabi@Store#2024');
  console.log('Role:', admin.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
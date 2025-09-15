const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@embabi.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true
    },
    create: {
      email: 'admin@embabi.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true
    },
  })

  console.log({ admin })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const images = await prisma.generatedImage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  })
  console.log(JSON.stringify(images, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.position.deleteMany({
    where: {
      config: {
        path: ['nftId'],
        equals: 4865121,
      },
    },
  });
  console.log(`Deleted ${result.count} position(s) with NFT ID 4865121`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

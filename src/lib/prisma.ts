import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is missing. Prisma will initialize without an adapter (this is normal during build).");
}

const getClient = () => {
  if (connectionString) {
    const pool = new Pool({ connectionString });
    // @ts-expect-error - Type mismatch between pg and @prisma/adapter-pg
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? getClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

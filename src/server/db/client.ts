import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Use Transaction Pooler (port 6543) for serverless — releases connections after each query
  const txnUrl = connectionString.replace(
    /pooler\.supabase\.com:\d+/,
    "pooler.supabase.com:6543",
  );
  const adapter = new PrismaPg({
    connectionString: txnUrl,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

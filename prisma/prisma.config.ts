import path from "node:path";
import { defineConfig } from "prisma/config";

// dotenv doesn't work in Prisma config on Windows — using process.env (set by Vercel / shell)
export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});

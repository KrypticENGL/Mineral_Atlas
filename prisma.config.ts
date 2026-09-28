import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a session connection; Supabase's transaction pooler can't run them.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});

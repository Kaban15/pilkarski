require("dotenv").config({ quiet: true });
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../prisma/migrations/20260328140000_add_tournaments/migration.sql"),
      "utf-8"
    );

    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        console.log("OK:", stmt.substring(0, 60) + "...");
      } catch (e) {
        // Ignore "already exists" errors
        if (e.message.includes("already exists") || e.message.includes("duplicate")) {
          console.log("SKIP (exists):", stmt.substring(0, 60) + "...");
        } else {
          console.error("ERROR:", e.message, "\nSQL:", stmt.substring(0, 100));
        }
      }
    }

    // Mark migration as applied
    await client.query(
      "INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count) VALUES (gen_random_uuid(), 'manual', '20260328140000_add_tournaments', NOW(), 1) ON CONFLICT DO NOTHING"
    );
    console.log("\nMigration marked as applied. DONE.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });

require("dotenv").config({ quiet: true });
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../prisma/migrations/20260328160000_add_cost_fields/migration.sql"),
      "utf-8"
    );
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        console.log("OK:", stmt.substring(0, 70));
      } catch (e) {
        if (e.message.includes("already exists") || e.message.includes("duplicate")) {
          console.log("SKIP:", stmt.substring(0, 70));
        } else {
          console.error("ERROR:", e.message);
        }
      }
    }

    await client.query(
      "INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count) VALUES (gen_random_uuid(), 'manual', '20260328160000_add_cost_fields', NOW(), 1) ON CONFLICT DO NOTHING"
    );
    console.log("Migration marked as applied. DONE.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });

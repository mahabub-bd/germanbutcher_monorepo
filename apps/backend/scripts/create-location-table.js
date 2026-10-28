// One-off: create the location table (idempotent) — needed in production,
// where synchronize is disabled. Matches the TypeORM entity in
// src/location/entities/location.entity.ts (enum type name included).
//
// Usage: node scripts/create-location-table.js [--db gb_production]
"use strict";
const fs = require("fs");
const path = require("path");
const { DataSource } = require("typeorm");

for (const line of fs
  .readFileSync(path.resolve(__dirname, "../.env"), "utf8")
  .split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}
const ARGS = process.argv.slice(2);
if (ARGS.includes("--db")) {
  process.env.DATABASE_NAME = ARGS[ARGS.indexOf("--db") + 1];
}

const DDL = [
  `DO $$ BEGIN
     CREATE TYPE "location_type_enum" AS ENUM ('division', 'city', 'area');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE TABLE IF NOT EXISTS location (
     id SERIAL PRIMARY KEY,
     name character varying(255) NOT NULL,
     type "location_type_enum" NOT NULL,
     "parentId" INTEGER,
     CONSTRAINT "FK_location_parent" FOREIGN KEY ("parentId")
       REFERENCES location(id) ON DELETE CASCADE
   );`,
  // divisions have NULL parentId; expression index makes them unique by name
  `CREATE UNIQUE INDEX IF NOT EXISTS "UNIQ_location_division_name"
     ON location (name) WHERE type = 'division';`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UNIQ_location_parent_name"
     ON location ("parentId", name);`,
];

async function main() {
  const ds = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    extra: { connectionTimeoutMillis: 8000 },
  });
  await ds.initialize();
  for (const sql of DDL) await ds.query(sql);
  const counts = await ds.query(
    "SELECT type, COUNT(*)::int AS c FROM location GROUP BY type ORDER BY type",
  );
  console.log(
    process.env.DATABASE_NAME,
    "ready | rows:", JSON.stringify(counts),
  );
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

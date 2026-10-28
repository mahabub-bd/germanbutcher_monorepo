// Idempotent seeder for the `location` table (division -> city -> area).
// Source of truth: scripts/bd-districts-areas.js + the division map that
// mirrors the frontend DIVISION_DISTRICTS.
//
// Usage:
//   node scripts/seed-locations.js                  # DB from .env (gb_test)
//   node scripts/seed-locations.js --db gb_production
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

const DIV = {
  Barisal: ["Barguna", "Barisal", "Bhola", "Jhalokathi", "Patuakhali", "Perojpur"],
  Chittagong: [
    "Bandarban", "Brahmanbaria", "Chandpur", "Chittagong", "Comilla",
    "Cox's Bazar", "Feni", "Khagrachari", "Laksmipur", "Noakhali", "Rangamati",
  ],
  Dhaka: [
    "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur",
    "Manikganj", "Munshiganj", "Narayanganj", "Norshingdi", "Rajbari",
    "Shariatpur", "Tangail",
  ],
  Khulna: [
    "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia",
    "Magura", "Meherpur", "Narail", "Satkhira",
  ],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  Rajshahi: [
    "Bogra", "Chapai Nawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna",
    "Rajshahi", "Sirajganj",
  ],
  Rangpur: [
    "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
    "Panchagarh", "Rangpur", "Thakurgaon",
  ],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
};

const { DISTRICT_AREAS } = require("./bd-districts-areas");

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

  // index existing rows: type|parentId|name -> id
  const existing = await ds.query("SELECT id, name, type, \"parentId\" FROM location");
  const keyOf = (type, parentId, name) =>
    type + "|" + (parentId == null ? "" : parentId) + "|" + name;
  const byKey = new Map(
    existing.map((r) => [keyOf(r.type, r.parentId, r.name), r.id]),
  );
  const idOf = {};
  for (const r of existing) {
    const k = "t:" + r.type + ":n:" + r.name;
    if (!(k in idOf)) idOf[k] = r.id;
  }

  let inserted = 0;
  const ensure = async (type, name, parentId) => {
    const key = keyOf(type, parentId, name);
    if (byKey.has(key)) return byKey.get(key);
    const res = await ds.query(
      'INSERT INTO location (name, type, "parentId") VALUES ($1, $2, $3) RETURNING id',
      [name, type, parentId == null ? null : parentId],
    );
    const id = res[0].id;
    byKey.set(key, id);
    const byName = "t:" + type + ":n:" + name;
    if (!(byName in idOf)) idOf[byName] = id;
    inserted++;
    return id;
  };

  for (const [division, districts] of Object.entries(DIV)) {
    const divisionId = await ensure("division", division, null);
    for (const district of districts) {
      const meta = DISTRICT_AREAS.find((d) => d.district === district);
      const cityId = await ensure("city", district, divisionId);
      if (meta) {
        for (const area of meta.areas) {
          await ensure("area", area, cityId);
        }
      }
    }
  }

  const counts = await ds.query(
    "SELECT type, COUNT(*)::int AS c FROM location GROUP BY type ORDER BY type",
  );
  console.log("inserted:", inserted, "| totals:", JSON.stringify(counts));
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// One-off: normalize city values and derive division from the canonical
// district->division map (mirrors frontend DIVISION_DISTRICTS) in gb_production.
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
process.env.DATABASE_NAME = "gb_production";

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
const divOf = {};
for (const [division, districts] of Object.entries(DIV))
  for (const district of districts) divOf[district] = division;

// non-canonical city spellings seen in prod
const cityAlias = { BARISHAL: "Barisal", Cumilla: "Comilla", "ঢাকা": "Dhaka" };

const APPLY = process.argv.includes("--apply");

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
  const rows = await ds.query(
    "SELECT id, division, city FROM address ORDER BY id",
  );

  const cityFixes = [];
  const divFixes = [];
  for (const r of rows) {
    let city = r.city == null ? null : String(r.city).trim();
    if (city && cityAlias[city]) city = cityAlias[city];
    if (city !== r.city) cityFixes.push({ id: r.id, from: r.city, to: city });
    const can = divOf[city];
    if (can && r.division !== can)
      divFixes.push({ id: r.id, city, from: r.division, to: can });
  }

  console.log(
    `city fixes: ${cityFixes.length}, division fixes: ${divFixes.length}`,
  );
  for (const f of cityFixes)
    console.log(`  city id=${f.id}: ${JSON.stringify(f.from)} -> ${JSON.stringify(f.to)}`);
  for (const f of divFixes)
    console.log(`  division id=${f.id} city=${f.city}: ${f.from} -> ${f.to}`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
  } else {
    await ds.transaction(async (em) => {
      for (const f of cityFixes)
        await em.query(`UPDATE address SET city = $1 WHERE id = $2`, [
          f.to,
          f.id,
        ]);
      for (const f of divFixes)
        await em.query(`UPDATE address SET division = $1 WHERE id = $2`, [
          f.to,
          f.id,
        ]);
    });
    console.log("\nApplied.");
  }

  const breakdown = await ds.query(
    "SELECT division, COUNT(*)::int AS c FROM address GROUP BY division ORDER BY c DESC",
  );
  console.log("division breakdown:", JSON.stringify(breakdown));
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

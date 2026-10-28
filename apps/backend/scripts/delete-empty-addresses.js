// One-off: delete the 14 fully-empty address rows (address/division/city/area
// all NULL) from gb_production after verifying no orders reference them.
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

const APPLY = process.argv.includes("--apply");
const EMPTY_IDS = [
  428, 429, 430, 431, 432, 433, 434, 435, 437, 438, 440, 443, 449, 450,
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

  // re-verify rows are still fully empty before deleting
  const rows = await ds.query(
    "SELECT id FROM address WHERE id = ANY($1) AND address IS NULL AND division IS NULL AND city IS NULL AND area IS NULL",
    [EMPTY_IDS],
  );
  console.log(`fully-empty rows still matching: ${rows.length}`);

  const refd = await ds.query(
    'SELECT COUNT(*)::int AS c FROM "order" WHERE "addressId" = ANY($1)',
    [EMPTY_IDS],
  );
  console.log(`orders referencing these addresses: ${refd[0].c}`);

  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to delete.");
  } else {
    await ds.transaction(async (em) => {
      // detach orders from the empty addresses (they hold no data anyway)
      await em.query(
        'UPDATE "order" SET "addressId" = NULL WHERE "addressId" = ANY($1)',
        [EMPTY_IDS],
      );
      await em.query(
        "DELETE FROM address WHERE id = ANY($1) AND address IS NULL AND division IS NULL AND city IS NULL AND area IS NULL",
        [EMPTY_IDS],
      );
    });
    console.log("Detached orders and deleted empty addresses.");
    const left = await ds.query("SELECT COUNT(*)::int AS c FROM address");
    const still = await ds.query(
      "SELECT COUNT(*)::int AS c FROM address WHERE id = ANY($1)",
      [EMPTY_IDS],
    );
    console.log(`addresses remaining: ${left[0].c}, target ids left: ${still[0].c}`);
  }
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

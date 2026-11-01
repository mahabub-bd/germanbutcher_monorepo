// One-off seeder for the delivery-coverage tables
// (delivery_coverage_divisions / _cities / _areas) in a DB where they were
// created manually but never populated — the app's auto-seed only fires when
// business_settings.deliveryCoverage jsonb holds legacy data.
//
// Priority: the business_settings jsonb (preserves the admin's enabled /
// charge / minimum / delivery-time state), falling back to the bundled
// Bangladesh dataset with everything enabled.
//
// Usage:
//   node scripts/seed-coverage-tables.js                    # DB from .env (gb_test), dry run
//   node scripts/seed-coverage-tables.js --db gb_production # target prod
//   node scripts/seed-coverage-tables.js --db gb_production --apply  # write
//   ... --force   # wipe existing coverage rows before seeding
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
const APPLY = ARGS.includes("--apply");
const FORCE = ARGS.includes("--force");

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

const toNumberOrNull = (v) => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const toTextOrNull = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};

/** Tree from the bundled dataset — everything enabled, no overrides. */
function datasetTree() {
  return {
    divisions: Object.keys(DIV).map((name) => ({
      name,
      enabled: true,
      deliveryTime: null,
    })),
    cities: Object.entries(DIV).flatMap(([division, list]) =>
      list.map((name) => ({
        division,
        name,
        enabled: true,
        deliveryCharge: null,
        minOrderAmount: null,
        deliveryTime: null,
      })),
    ),
    areas: DISTRICT_AREAS.flatMap(({ district, areas }) =>
      areas.map((name) => ({
        city: district,
        name,
        enabled: true,
        deliveryCharge: null,
        minOrderAmount: null,
        deliveryTime: null,
      })),
    ),
  };
}

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
  console.log("db:", process.env.DATABASE_NAME);

  const existing = await ds.query(
    'SELECT (SELECT COUNT(*)::int FROM "delivery_coverage_divisions") AS divisions, ' +
      '(SELECT COUNT(*)::int FROM "delivery_coverage_cities") AS cities, ' +
      '(SELECT COUNT(*)::int FROM "delivery_coverage_areas") AS areas',
  );
  const counts = existing[0];
  const hasData = counts.divisions + counts.cities + counts.areas > 0;

  // Source 1: the legacy business_settings jsonb (admin-configured state).
  let tree = null;
  const rows = await ds.query(
    'SELECT "deliveryCoverage" FROM business_setting WHERE id = 1',
  );
  const legacy = rows[0]?.deliveryCoverage;
  if (
    legacy &&
    Array.isArray(legacy.divisions) &&
    (legacy.divisions.length > 0 ||
      (legacy.cities ?? []).length > 0 ||
      (legacy.areas ?? []).length > 0)
  ) {
    tree = {
      divisions: legacy.divisions,
      cities: legacy.cities ?? [],
      areas: legacy.areas ?? [],
    };
    console.log("source: business_settings jsonb");
  } else {
    tree = datasetTree();
    console.log("source: bundled dataset (jsonb empty/absent)");
  }

  console.log(
    `will seed: ${tree.divisions.length} divisions, ${tree.cities.length} cities, ${tree.areas.length} areas`,
  );
  console.log("tables currently:", JSON.stringify(counts));

  if (hasData && !FORCE) {
    console.log(
      "tables already have rows — nothing done. Re-run with --force to wipe and reseed.",
    );
    await ds.destroy();
    return;
  }
  if (!APPLY) {
    console.log("dry run — re-run with --apply to write.");
    await ds.destroy();
    return;
  }

  // Multi-row INSERT with explicit columns (8 divisions + 64 cities + ~1400
  // areas stay well under Postgres's 65535 bound-parameter limit).
  const bulkInsert = async (tx, table, columns, rows, returning) => {
    if (rows.length === 0) return [];
    const params = [];
    const tuples = rows.map((row) => {
      const placeholders = row.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    const sql =
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) ` +
      `VALUES ${tuples.join(", ")}` +
      (returning ? ` RETURNING ${returning.map((c) => `"${c}"`).join(", ")}` : "");
    const result = await tx.query(sql, params);
    return returning ? result : null;
  };

  await ds.transaction(async (tx) => {
    if (hasData) {
      await tx.query('DELETE FROM "delivery_coverage_areas"');
      await tx.query('DELETE FROM "delivery_coverage_cities"');
      await tx.query('DELETE FROM "delivery_coverage_divisions"');
    }

    // Divisions
    const divisions = tree.divisions
      .filter((d) => d?.name)
      .map((d) => [
        d.name,
        d.enabled !== false,
        toTextOrNull(d.deliveryTime),
      ]);
    const divisionIds = new Map();
    for (const row of await bulkInsert(
      tx,
      "delivery_coverage_divisions",
      ["name", "enabled", "deliveryTime"],
      divisions,
      ["id", "name"],
    )) {
      divisionIds.set(row.name, Number(row.id));
    }

    // Cities (keyed "division|city" — city names repeat across divisions)
    const cityIds = new Map();
    const cityRows = tree.cities
      .filter((c) => c?.name && divisionIds.has(c?.division))
      .map((c) => [
        divisionIds.get(c.division),
        c.name,
        c.enabled !== false,
        toNumberOrNull(c.deliveryCharge),
        toNumberOrNull(c.minOrderAmount),
        toTextOrNull(c.deliveryTime),
      ]);
    if (cityRows.length > 0) {
      const divisionNameById = new Map(
        [...divisionIds].map(([name, id]) => [id, name]),
      );
      for (const row of await bulkInsert(
        tx,
        "delivery_coverage_cities",
        [
          "divisionId",
          "name",
          "enabled",
          "deliveryCharge",
          "minOrderAmount",
          "deliveryTime",
        ],
        cityRows,
        ["id", "name", "divisionId"],
      )) {
        const divisionName = divisionNameById.get(Number(row.divisionId));
        if (divisionName != null)
          cityIds.set(`${divisionName}|${row.name}`, Number(row.id));
      }
    }
    const skippedCities = tree.cities.length - cityRows.length;

    // Areas — exact "city|area" match, else any city with the same name
    const areaRows = [];
    let skippedAreas = 0;
    for (const a of tree.areas ?? []) {
      if (!a?.name) continue;
      const cityId =
        cityIds.get(`${a.city}|${a.name}`) ??
        (() => {
          const key = [...cityIds.keys()].find((k) =>
            k.endsWith(`|${a.city}`),
          );
          return key != null ? cityIds.get(key) : undefined;
        })();
      if (cityId == null) {
        skippedAreas++;
        continue;
      }
      areaRows.push([
        cityId,
        a.name,
        a.enabled !== false,
        toNumberOrNull(a.deliveryCharge),
        toNumberOrNull(a.minOrderAmount),
        toTextOrNull(a.deliveryTime),
      ]);
    }
    await bulkInsert(
      tx,
      "delivery_coverage_areas",
      [
        "cityId",
        "name",
        "enabled",
        "deliveryCharge",
        "minOrderAmount",
        "deliveryTime",
      ],
      areaRows,
      null,
    );

    console.log(
      `inserted: ${divisions.length} divisions, ${cityRows.length} cities (${skippedCities} skipped — unknown division), ${areaRows.length} areas (${skippedAreas} skipped — unknown city)`,
    );
  });

  const after = await ds.query(
    'SELECT (SELECT COUNT(*)::int FROM "delivery_coverage_divisions") AS divisions, ' +
      '(SELECT COUNT(*)::int FROM "delivery_coverage_cities") AS cities, ' +
      '(SELECT COUNT(*)::int FROM "delivery_coverage_areas") AS areas',
  );
  console.log("tables after:", JSON.stringify(after[0]));
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

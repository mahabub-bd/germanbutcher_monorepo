-- 2026-11-02 — Dhaka District coverage: add the 5 upazila areas, and move
-- the district-locality areas out of "Dhaka City".
--
-- Mirror of the gb_test change (2026-11-02). Prod already has the
-- "Dhaka District" city row (id 385, empty); gb_test used id 450 — matched
-- by name here so ids don't matter.
--
-- Verified against gb_production on 2026-11-02:
--   Dhaka City     (id 338, 541 areas) — still holds Savar Cantonment,
--     Kaliganj - Keraniganj, Kodomtoli(Keraniganj), plus duplicate
--     Dhamrai / Dohar / Savar entries.
--   Dhaka District (id 385, 0 areas).
--
-- Idempotent: re-running inserts nothing new and moves/deletes nothing.
-- Wrapped in a transaction; review then COMMIT.

BEGIN;

-- 1) Seed the five upazila areas under Dhaka District (skip existing).
INSERT INTO delivery_coverage_areas ("cityId", name, enabled,
                                     "deliveryCharge", "minOrderAmount",
                                     "deliveryTime")
SELECT d.id, a.upazila, true, NULL, NULL, NULL
FROM (VALUES
  ('Dhamrai'),
  ('Dohar'),
  ('Keraniganj'),
  ('Nawabganj'),
  ('Savar')
) AS a(upazila)
JOIN delivery_coverage_cities d ON d.name = 'Dhaka District'
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_coverage_areas x
  WHERE x."cityId" = d.id AND x.name = a.upazila
);

-- 2) Move the district-locality areas that only exist in Dhaka City over to
--    Dhaka District (pricing/flags travel with the row).
UPDATE delivery_coverage_areas x
SET "cityId" = d.id
FROM delivery_coverage_cities c, delivery_coverage_cities d
WHERE c.id = x."cityId"
  AND c.name = 'Dhaka City'
  AND d.name = 'Dhaka District'
  AND x.name IN ('Savar Cantonment', 'Kaliganj - Keraniganj',
                 'Kodomtoli(Keraniganj)');

-- 3) Remove Dhaka City's exact duplicates of the five upazilas (the district
--    row now owns them). Only names that actually exist in the district are
--    deleted, so nothing is lost.
DELETE FROM delivery_coverage_areas x
USING delivery_coverage_cities c, delivery_coverage_cities d,
      delivery_coverage_areas y
WHERE c.id = x."cityId"
  AND c.name = 'Dhaka City'
  AND d.name = 'Dhaka District'
  AND y."cityId" = d.id
  AND y.name = x.name;

COMMIT;

-- Verify after commit (expect 8 rows: the 5 upazilas + 3 moved localities):
-- SELECT a.name FROM delivery_coverage_areas a
-- JOIN delivery_coverage_cities c ON c.id = a."cityId"
-- WHERE c.name = 'Dhaka District' ORDER BY a.name;
-- Expect 0 rows (no district names left behind in Dhaka City):
-- SELECT x.name FROM delivery_coverage_areas x
-- JOIN delivery_coverage_cities c ON c.id = x."cityId"
-- JOIN delivery_coverage_cities d ON d.name = 'Dhaka District'
-- WHERE c.name = 'Dhaka City' AND x.name IN
--   ('Dhamrai','Dohar','Keraniganj','Nawabganj','Savar',
--    'Savar Cantonment','Kaliganj - Keraniganj','Kodomtoli(Keraniganj)');

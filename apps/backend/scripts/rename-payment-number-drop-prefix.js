/**
 * Drop the PAY-/REF- prefixes from payment numbers: PAY-2026-1636 -> 2026-1636.
 *
 * Payments and refunds share one table and one unique paymentNumber column,
 * so both prefixes drop into a SINGLE shared sequence. Rows whose stripped
 * number collides (e.g. PAY-2026-0006 + REF-2026-0006) are renumbered to
 * continue after the current max, oldest id first.
 *
 * Run against EVERY database, AFTER deploying the new backend
 * (order-payment.service.ts getNextPaymentNumber tolerates both formats
 * during the transition).
 *
 * Usage: node scripts/rename-payment-number-drop-prefix.js
 * Reads DB creds from .env (DATABASE_*), honours DATABASE_NAME.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const c = new Client({
  host: env.DATABASE_HOST,
  port: +env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
});

(async () => {
  await c.connect();
  await c.query('BEGIN');
  try {
    const { rows } = await c.query(
      `SELECT id, "paymentNumber", "paymentType" FROM order_payment
       WHERE "paymentNumber" LIKE 'PAY-%' OR "paymentNumber" LIKE 'REF-%'
       ORDER BY id`,
    );
    console.log(`prefixed rows: ${rows.length}`);

    // Pass 1: strip prefixes, remember each row's target.
    const targets = new Map(); // id -> stripped number
    const seen = new Set(); // stripped numbers already claimed
    for (const r of rows) {
      const stripped = r.paymentNumber.slice(4);
      targets.set(r.id, stripped);
      // Mark ALL stripped values as claimed for now — collision resolution
      // in pass 2 decides which row keeps the number.
    }

    // Which stripped numbers are duplicated?
    const dupCounts = {};
    for (const n of targets.values()) dupCounts[n] = (dupCounts[n] || 0) + 1;

    // Current max numeric tail across the whole table (any format), so
    // renumbered rows continue after everything else.
    const maxRow = await c.query(
      `SELECT "paymentNumber" FROM order_payment
       WHERE "paymentNumber" ~ '^\\d{4}-\\d{4}$' OR "paymentNumber" LIKE 'PAY-%' OR "paymentNumber" LIKE 'REF-%'
       ORDER BY RIGHT("paymentNumber", 4) DESC LIMIT 1`,
    );
    let nextFree =
      parseInt(maxRow.rows[0]?.paymentNumber.split('-').pop(), 10) || 0;

    // Pass 2: rows holding a duplicated stripped number — the FIRST (lowest
    // id) keeps it, the rest get renumbered to max+1, oldest first.
    const updates = []; // { id, newNumber }
    const reassigned = new Set();
    for (const r of rows) {
      const n = targets.get(r.id);
      if (dupCounts[n] > 1 && !reassigned.has(n)) {
        reassigned.add(n); // first row keeps the number
        continue;
      }
      if (dupCounts[n] > 1) {
        nextFree += 1;
        const year = r.paymentNumber.slice(4, 8); // "PAY-2026-0006" -> "2026"
        updates.push({ id: r.id, newNumber: `${year}-${pad(nextFree)}` });
      }
    }

    function pad(n) {
      return String(n).padStart(4, '0');
    }

    // Apply: renumbered rows go FIRST (to their final, unique, unprefixed
    // value) so the bulk strip below never produces a duplicate mid-flight.
    for (const u of updates) {
      await c.query(`UPDATE order_payment SET "paymentNumber" = $1 WHERE id = $2`, [
        u.newNumber,
        u.id,
      ]);
    }
    await c.query(
      `UPDATE order_payment SET "paymentNumber" = SUBSTRING("paymentNumber" FROM 5)
       WHERE "paymentNumber" LIKE 'PAY-%' OR "paymentNumber" LIKE 'REF-%'`,
    );

    // Verify uniqueness.
    const dup = await c.query(
      `SELECT count(*) FROM (SELECT "paymentNumber" FROM order_payment GROUP BY 1 HAVING count(*) > 1) d`,
    );
    if (dup.rows[0].count !== '0') {
      throw new Error(`duplicates remain: ${dup.rows[0].count}`);
    }
    await c.query('COMMIT');
    console.log(`renumbered (collision) rows: ${updates.length}`);
    const sample = await c.query(
      `SELECT "paymentNumber" FROM order_payment ORDER BY id DESC LIMIT 5`,
    );
    console.log('newest:', sample.rows.map((r) => r.paymentNumber).join(', '));
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('FAILED, rolled back:', e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();

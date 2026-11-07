
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
    const before = await c.query(
      `SELECT
         (SELECT count(*) FROM "order"
          WHERE "orderNo" ~ '^[0-9]{4}-[0-9]{1,5}$') AS orders,
         (SELECT count(*) FROM order_payment
          WHERE "paymentNumber" ~ '^[0-9]{4}-[0-9]{1,5}$') AS payments`,
    );
    console.log(
      `rows to re-pad: orders=${before.rows[0].orders} payments=${before.rows[0].payments}`,
    );

    await c.query(
      `UPDATE "order"
       SET "orderNo" = split_part("orderNo", '-', 1) || '-' ||
                       lpad(split_part("orderNo", '-', 2), 6, '0')
       WHERE "orderNo" ~ '^[0-9]{4}-[0-9]{1,5}$'`,
    );
    await c.query(
      `UPDATE order_payment
       SET "paymentNumber" = split_part("paymentNumber", '-', 1) || '-' ||
                             lpad(split_part("paymentNumber", '-', 2), 6, '0')
       WHERE "paymentNumber" ~ '^[0-9]{4}-[0-9]{1,5}$'`,
    );

    const dup = await c.query(
      `SELECT
         (SELECT count(*) FROM (
            SELECT "orderNo" FROM "order" GROUP BY 1 HAVING count(*) > 1
          ) d1) AS order_dups,
         (SELECT count(*) FROM (
            SELECT "paymentNumber" FROM order_payment GROUP BY 1 HAVING count(*) > 1
          ) d2) AS payment_dups`,
    );
    if (dup.rows[0].order_dups !== '0' || dup.rows[0].payment_dups !== '0') {
      throw new Error(
        `duplicates: orders=${dup.rows[0].order_dups} payments=${dup.rows[0].payment_dups}`,
      );
    }

    await c.query('COMMIT');
    console.log('re-padded OK, no duplicates');

    const sampleO = await c.query(
      `SELECT "orderNo" FROM "order" ORDER BY id DESC LIMIT 5`,
    );
    const sampleP = await c.query(
      `SELECT "paymentNumber" FROM order_payment ORDER BY id DESC LIMIT 5`,
    );
    console.log('newest orders:', sampleO.rows.map((r) => r.orderNo).join(', '));
    console.log(
      'newest payments:',
      sampleP.rows.map((r) => r.paymentNumber).join(', '),
    );
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('FAILED, rolled back:', e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();

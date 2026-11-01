// Temp repro: run the SQL TypeORM generates for getCustomerListReport
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const env = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const get = (k) => {
    const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
    return m ? m[1].trim() : undefined;
};

(async () => {
    const client = new Client({
        host: get("DATABASE_HOST"),
        port: parseInt(get("DATABASE_PORT") || "5432", 10),
        database: get("DATABASE_NAME"),
        user: get("DATABASE_USER"),
        password: get("DATABASE_PASSWORD"),
    });
    await client.connect();

    // last_month bounds (Dhaka) — Nov 1 2026 -> Oct 2026
    const from = "2025-09-30T18:00:00.000Z";
    const to = "2025-10-31T17:59:59.999Z";

    const sql = `
    SELECT DISTINCT "distinctAlias"."user_id" AS "ids_user_id"
    FROM (
      SELECT "user"."id" AS "user_id",
             "user"."name" AS "user_name",
             "user"."email" AS "user_email",
             "user"."mobileNumber" AS "user_mobileNumber",
             "user"."createdAt" AS "user_createdAt",
             "orders"."id" AS "orders_id",
             "orders"."orderNo" AS "orders_orderNo",
             "orders"."totalValue" AS "orders_totalValue"
      FROM "user" "user"
      LEFT JOIN "role" "role" ON "role"."id" = "user"."roleId"
      LEFT JOIN "order" "orders" ON "orders"."userId" = "user"."id"
      WHERE "role"."id" = $3
        AND "user"."createdAt" BETWEEN $1 AND $2
    ) "distinctAlias"
    ORDER BY "distinctAlias"."user_id" DESC, "user_id" ASC
    LIMIT 100`;

    try {
        const r = await client.query(sql, [from, to, 3]);
        console.log("OK rows:", r.rowCount);
    } catch (e) {
        console.log("ERROR:", e.message);
        console.log("LENGTH:", e.length, "CODE:", e.code, "DETAIL:", e.detail, "HINT:", e.hint, "COLUMN:", e.column, "TABLE:", e.table);
    }
    await client.end();
})();

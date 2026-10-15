const { Client } = require("pg");
const fs = require("fs");
const env = {};
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const client = new Client({
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT),
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
});
(async () => {
  await client.connect();
  const { rows } = await client.query(
    `SELECT id, name, "parentId", url, "isAdminMenu", "isActive" FROM "menu"
     WHERE url LIKE '%products%' OR url LIKE '%procurement%' OR url LIKE '%user-list%' OR url LIKE '%brand%'
     ORDER BY id`
  );
  console.table(rows);
  await client.end();
})().catch((e) => { console.error(e.message); process.exit(1); });

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typeorm_1 = require("typeorm");
const bd_districts_areas_1 = require("./bd-districts-areas");
for (const line of fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env))
        process.env[m[1]] = m[2];
}
const norm = (s) => (s ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b0+(?=\d)/g, '')
    .trim();
const tokens = (s) => norm(s).split(' ').filter(Boolean);
const districtByNorm = new Map();
for (const { district } of bd_districts_areas_1.DISTRICT_AREAS) {
    districtByNorm.set(norm(district), district);
}
const areasByDistrictNorm = new Map();
for (const { district, areas } of bd_districts_areas_1.DISTRICT_AREAS) {
    const m = new Map();
    for (const area of areas)
        m.set(norm(area), area);
    areasByDistrictNorm.set(norm(district), m);
}
const baseByDistrictNorm = new Map();
for (const { district, areas } of bd_districts_areas_1.DISTRICT_AREAS) {
    const counts = new Map();
    for (const area of areas) {
        const base = norm(area).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        if (!base)
            continue;
        counts.set(base, (counts.get(base) ?? 0) + 1);
    }
    const m = new Map();
    for (const area of areas) {
        const base = norm(area).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        if (!base)
            continue;
        if ((counts.get(base) ?? 0) !== 1)
            continue;
        const list = m.get(base) ?? [];
        list.push(area);
        m.set(base, list);
    }
    baseByDistrictNorm.set(norm(district), m);
}
const globalAreaIndex = new Map();
for (const { district, areas } of bd_districts_areas_1.DISTRICT_AREAS) {
    for (const area of areas) {
        const key = norm(area);
        const list = globalAreaIndex.get(key) ?? [];
        list.push({ district, area });
        globalAreaIndex.set(key, list);
    }
}
function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const prev = new Array(n + 1).fill(0).map((_, i) => i);
    const curr = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        for (let j = 0; j <= n; j++)
            prev[j] = curr[j];
    }
    return prev[n];
}
const districtAliases = {
    chattogram: 'Chittagong',
    barishal: 'Barisal',
    bogura: 'Bogra',
    jashore: 'Jessore',
    cumilla: 'Comilla',
    narsingdi: 'Norshingdi',
    narshingdi: 'Norshingdi',
    netrakona: 'Netrokona',
    moulovibazar: 'Moulvibazar',
    pirojpur: 'Perojpur',
    lakshmipur: 'Laksmipur',
    chapainawabganj: 'Chapai Nawabganj',
    coxsbazar: "Cox's Bazar",
};
function matchDistrictPasses(raw) {
    const n = norm(raw);
    if (!n)
        return null;
    if (districtAliases[n])
        return districtAliases[n];
    const exact = districtByNorm.get(n);
    if (exact)
        return exact;
    const stripped = n.replace(/\b(city|district|sadar)\b/g, '').trim();
    if (districtByNorm.get(stripped))
        return districtByNorm.get(stripped);
    const noPostcode = tokens(n)
        .filter((t) => !/^\d{4}$/.test(t))
        .join(' ');
    return districtByNorm.get(noPostcode) ?? null;
}
function matchArea(district, raw) {
    const n = norm(raw);
    if (!n)
        return null;
    const areas = areasByDistrictNorm.get(norm(district));
    if (!areas)
        return null;
    const exact = areas.get(n);
    if (exact)
        return exact;
    const t = tokens(n);
    const sortedT = [...t].sort().join(' ');
    for (const [key, canonical] of areas) {
        if (key.length &&
            t.length &&
            [...key.split(' ')].sort().join(' ') === sortedT) {
            return canonical;
        }
    }
    const baseHits = baseByDistrictNorm.get(norm(district)).get(n);
    if (baseHits && baseHits.length === 1)
        return baseHits[0];
    const hits = new Set();
    for (const [key, canonical] of areas) {
        if (!key)
            continue;
        const kt = key.split(' ');
        if (kt.every((w) => t.includes(w)))
            hits.add(canonical);
    }
    if (hits.size === 1)
        return [...hits][0];
    const prefixHits = new Set();
    for (const [key, canonical] of areas) {
        if (!key)
            continue;
        const kt = key.split(' ');
        if (t.every((w) => kt.includes(w)))
            prefixHits.add(canonical);
    }
    if (prefixHits.size === 1)
        return [...prefixHits][0];
    let best = null;
    let bestDist = 2;
    let unique = true;
    for (const [key, canonical] of areas) {
        if (Math.abs(key.length - n.length) > 1)
            continue;
        const d = levenshtein(n, key);
        if (d === 0)
            continue;
        if (d < bestDist && n.length >= 5) {
            best = canonical;
            bestDist = d;
            unique = true;
        }
        else if (d === bestDist && best && best !== canonical) {
            unique = false;
        }
    }
    return unique ? best : null;
}
function matchLocation(city, area) {
    const district = matchDistrictPasses(city);
    if (district) {
        const a = matchArea(district, area ?? city);
        return a ? { district, area: a } : null;
    }
    const n = norm(city);
    if (!n)
        return null;
    const asArea = globalAreaIndex.get(n) ?? [...globalAreaIndex.entries()].find(([k]) => k.startsWith(n + ' '))?.[1];
    if (!asArea || asArea.length !== 1)
        return null;
    const { district: d2, area: canonical } = asArea[0];
    const a = matchArea(d2, area) ?? canonical;
    return { district: d2, area: a };
}
async function main() {
    const apply = process.argv.includes('--apply');
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        extra: { connectionTimeoutMillis: 8000 },
    });
    await dataSource.initialize();
    const rows = await dataSource.query('SELECT id, user_id, city, area, division FROM address ORDER BY id');
    console.log(`Loaded ${rows.length} addresses`);
    const updates = [];
    const unmatched = [];
    for (const row of rows) {
        const loc = matchLocation(row.city, row.area);
        if (!loc) {
            unmatched.push(row);
            continue;
        }
        if (loc.district !== row.city || loc.area !== row.area) {
            updates.push({ id: row.id, city: loc.district, area: loc.area });
        }
    }
    console.log(`matched: ${rows.length - unmatched.length}, already canonical: ${rows.length - unmatched.length - updates.length}, to update: ${updates.length}, unmatched: ${unmatched.length}`);
    if (unmatched.length) {
        console.log('\n--- Unmatched rows (need manual fixing) ---');
        for (const r of unmatched) {
            console.log(`id=${r.id} user=${r.user_id} city="${r.city}" area="${r.area}"`);
        }
    }
    if (apply && updates.length) {
        await dataSource.transaction(async (em) => {
            for (const u of updates) {
                await em.query(`UPDATE address SET city = $1, area = $2 WHERE id = $3`, [
                    u.city,
                    u.area,
                    u.id,
                ]);
            }
        });
        console.log(`\nApplied ${updates.length} updates`);
    }
    else if (!apply) {
        console.log('\nDry run only. Re-run with --apply to write changes.');
    }
    await dataSource.destroy();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=migrate-address-locations.js.map
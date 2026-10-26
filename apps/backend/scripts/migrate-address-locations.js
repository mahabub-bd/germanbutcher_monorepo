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
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
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
        const base = norm(area.replace(/\s*\([^)]*\)\s*/g, ' ').trim());
        if (!base)
            continue;
        counts.set(base, (counts.get(base) ?? 0) + 1);
    }
    const m = new Map();
    for (const area of areas) {
        const base = norm(area.replace(/\s*\([^)]*\)\s*/g, ' ').trim());
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
// Bangla district names (normalized, sadar/postcode stripped) -> canonical district
const banglaDistrictAliases = {
    'ঢাকা': 'Dhaka',
    'গাজীপুর': 'Gazipur',
    'ময়মনসিংহ': 'Mymensingh',
    'নারায়ণগঞ্জ': 'Narayanganj',
    'চট্টগ্রাম': 'Chittagong',
    'রাজশাহী': 'Rajshahi',
    'খুলনা': 'Khulna',
    'সিলেট': 'Sylhet',
    'বরিশাল': 'Barisal',
    'রংপুর': 'Rangpur',
    'কুমিল্লা': 'Comilla',
    'ফরিদপুর': 'Faridpur',
    'টাঙ্গাইল': 'Tangail',
};
// Bangla area words (normalized tokens) -> English tokens used in DISTRICT_AREAS
const banglaTokenAliases = {
    'বাড্ডা': 'badda',
    'ধানমন্ডি': 'dhanmondi',
    'আদাবর': 'adabor',
    'দক্ষিণখান': 'dakshinkhan',
    'ডেমরা': 'demra',
    'সাভার': 'savar',
    'মাটিকাটা': 'matikata',
    'উত্তরা': 'uttara',
    'মিরপুর': 'mirpur',
    'বসুন্ধরা': 'bashundhara',
    'গুলশান': 'gulshan',
    'বনানী': 'banani',
    'মহাখালী': 'mohakhali',
    'মোহাম্মদপুর': 'mohammadpur',
    'লালমাটিয়া': 'lalmatia',
    'শ্যামলী': 'shyamoli',
    'কালাবাগান': 'kalabagan',
    'খিলগাঁও': 'khilgaon',
    'যাত্রাবাড়ী': 'jatrabari',
    'সাইনবোর্ড': 'signboard',
    // district names appearing inside area strings
    'ঢাকা': 'dhaka',
    'নারায়ণগঞ্জ': 'narayanganj',
    'গাজীপুর': 'gazipur',
    'ময়মনসিংহ': 'mymensingh',
    'চট্টগ্রাম': 'chittagong',
    'কুমিল্লা': 'comilla',
    'সিলেট': 'sylhet',
    'রাজশাহী': 'rajshahi',
    'খুলনা': 'khulna',
    'কেরানীগঞ্জ': 'keraniganj',
    'কামরাঙ্গীরচর': 'kamrangichar',
    'গেন্ডারিয়া': 'gandaria',
    মারাদিয়া: 'maradia',
    সদর: 'sadar',
};
// Full Bangla/mixed area strings that need a direct canonical target
const banglaAreaAliases = {
    'baridhara diplomatic': 'Baridhara',
    bashundhara: 'Bashundhara R/A',
    shiddeshswari: 'Shiddheswari',
    'bashundhara ra': 'Bashundhara R/A',
    'utter badda': 'Uttor Badda',
    'uttar badda': 'Uttor Badda',
    'shadhinota sarani somiti building': 'Uttor Badda',
    'uday south point': 'Uttor Badda',
    's badda': 'South Badda',
    'dokkhin badda': 'South Badda',
    'dokkin badda': 'South Badda',
    'nazimuddin road': 'Nazimuddin Road (Puran Dhaka)',
    'nanir bari mor kha 81 2': 'Middle Badda',
    'mirpur road': 'Mirpur Road Kallynpur',
    'mirpur road kallynpur': 'Mirpur Road Kallynpur',
    mirpur10: 'Mirpur 10',
    'mirpur 60ft': 'Mirpur 60 feet',
    'mirpur 60 ft': 'Mirpur 60 feet',
    'mirpur 12 pallabi': 'Mirpur - 12',
    'mirpur 11 pallabi dhaka 1216': 'Mirpur - 11',
    mirpur12: 'Mirpur - 12',
    'mirpur dohs dhaka 1216': 'Mirpur DOHS',
    'mirpur dohs road mirpur 9 pallabi': 'Mirpur DOHS',
    'mirpur 13 kafrul 1216': 'Mirpur - 13',
    'pallabi mirpur': 'Pallabi',
    'pallabi mirpur 11': 'Mirpur - 11',
    'pallabi mirpur 12': 'Mirpur - 12',
    'senpara parbata mirpur 10': 'Mirpur 10',
    'uttar tolarbag mirpur 1': 'Mirpur 1',
    'uttor kafrul mirpur 14': 'Mirpur - 14',
    'arambag mirpur 7': 'Arambag (Mirpur)',
    dhanmomdi: 'Dhanmondi',
    'dhanmondi dhaka': 'Dhanmondi',
    'dhanmondi residential area': 'Dhanmondi',
    'dhanmondi road 8 a house 52 1 flat d2': 'Dhanmondi - Rd 8A',
    'farmgate near farmgate metro rail station tejgaon dhaka': 'Farmgate',
    'farmgate tejgaon': 'Farmgate',
    framgate: 'Farmgate',
    '100 feet vhatara': 'Vatara',
    vhatara: 'Vatara',
    'gulshan notun bazar': 'Notun Bazar',
    '55 3 english road tati bazar mor dhaka': 'Tatibazar',
    'ammar city jannatbagh ghatarchar keraniganj': 'Keranigonj',
    'banasree maradiya': 'Banasree (Rampura)',
    '100 feet vhatara gulshan notun bazar': 'Vatara',
    'madani avenue notunbazar': 'Notun Bazar',
    'gendaria notun rasta': 'Gandaria',
    'bashundhara residential area': 'Bashundhara R/A',
    'bashundhara residential': 'Bashundhara R/A',
    'bashundhara residencial': 'Bashundhara R/A',
    bashundara: 'Bashundhara R/A',
    bashubdhara: 'Bashundhara R/A',
    'bashundhara r a vatara': 'Bashundhara R/A',
    'bashundara r a dhaka': 'Bashundhara R/A',
    'd block bashundhora': 'Bashundhara R/A',
    'south banasree': 'Banasree (Rampura)',
    'south banasree near kazi bari': 'Banasree (Rampura)',
    'west dewanpara vashantek': 'Dewanpara',
    's s road sirajganj sador sirajganj': 'Sirajganj Sadar',
    'uttara uttar khan heall market bapri bari purbo para': 'Uttarkhan',
    'south kafrul kochukhet': 'Kochukhet',
    'banasree rampura dhaka 1219': 'Banasree (Rampura)',
    'banasree project rampura': 'Banasree (Rampura)',
    'rampura banasree dhaka': 'Banasree (Rampura)',
    'balughat green city': 'Balughat',
    'balughat bazzar': 'Balughat',
    'bangabhaban 4no gate dilkusha chawkhbazar churihatta': 'Chawkbazar (Dhaka)',
    chawkhbazar: 'Chawkbazar (Dhaka)',
    'chawkhbazar churihatta': 'Chawkbazar (Dhaka)',
    'eastern housing second phase pallabi': 'Eastern Housing (Pallabi)',
    'elephant road new market dhaka': 'Elephant Road',
    'new market elephant road': 'Elephant Road',
    'new elephant road': 'Elephant Road',
    'kuril kazibari vatara 1229': 'Kuril',
    mugda: 'Mughdapara',
    'mayakanon mugda': 'Mughdapara',
    'south mugdapara kazi jafor school garments goli': 'Mughdapara',
    narayanganj: 'Chashara (Narayanganj)',
    'narayanganj chasara': 'Chashara (Narayanganj)',
    'narayanganj nitaigonj': 'Chashara (Narayanganj)',
    'niketon gulshan 1': 'Niketon',
    'niketon gulshan': 'Niketon',
    'boro moghbazar ramna': 'Moghbazar',
    paltan: 'Purana Paltan',
    shaympur: 'Shyampur',
    lalbaag: 'Lalbagh',
    'lalbagh urduroad': 'Lalbagh',
    khilgaw: 'Khilgaon',
    'jigatala tannery mor': 'Jhigatola',
    dhakkinkhan: 'Dakshinkhan',
    jashore: 'Jessore Sadar',
    bogra: 'Bogra Sadar',
    manikganj: 'Manikganj Sadar',
    tangail: 'Tangail Sadar',
    'cumilla sodor darogabari': 'Comilla Sadar',
    hossainmarket: 'Hossain Market (Tongi)',
    bonosree: 'Banasree (Rampura)',
    bansreee: 'Banasree (Rampura)',
    banasre: 'Banasree (Rampura)',
    'basundhara ra': 'Bashundhara R/A',
    boashundhara: 'Bashundhara R/A',
    askhona: 'Ashkona',
    'kawla bazar ashkona': 'Ashkona',
    'uttara dhaka 1230': 'Uttara',
    'uttara dhaka': 'Uttara',
    'dhaka uttara': 'Uttara',
    sonirakra: 'Shonir Akhra',
    'sonir akhra shekhdi': 'Shonir Akhra',
    'west malibagh': 'Malibag',
    'west hazipara': 'Hajipara (Rampura)',
    'vatara shahjadpur': 'Vatara',
    'shahjadpur vatara': 'Shahjadpur',
    'savar ashulia': 'Ashulia',
    'police town savar': 'Savar',
    'new eskaton banglamotor': 'Eskaton',
    'new dohs mohakhali': 'Mohakhali DOHS',
    'mohakhali new dohs': 'Mohakhali DOHS',
    'mohakhali wireless': 'Wireless',
    'motojheel dhaka': 'Motijheel',
    'nobabpur road': 'Nawabpur',
    'noya bazaar': 'Naya Bazar',
    'puran dhaka armanitola': 'Armanitola',
    'sutrapur thana 1100 puran dhaka': 'Sutrapur',
    'south keraniganj': 'Keranigonj',
    'keraniganj model': 'Keranigonj',
    'kalatiya keraniganj dhak': 'Keranigonj',
    kamranghirchar: 'Kamrangichar',
    'kamrangir chor': 'Kamrangichar',
    'gec khulshi': 'GEC',
    halishar: 'Halishahar',
    'textile bayezid': 'Bayezid Bostami',
    mohadevpur: 'Mahadebpur',
    'mojumdar mor vasantek': 'Vashantek',
    'mohanogor project': 'Mahanogor',
    'mohammadi homes': 'Mohammadia Housing',
    'mizmizi mouchak': 'Mouchak',
    'matikata cantonment d': 'Matikata',
    'malibagh dit road': 'Malibag',
    'kashimpur gazipur': 'Kashempur',
    'kachukhet cantonment': 'Kochukhet',
    'jatrabary dhaka a 1362': 'Jatrabari',
    epz: 'Export Processing',
    'east kafrul': 'Kafrul',
    demra: 'Demra',
    chokoria: 'Chakoria',
    bhaluka: 'Bhaluka',
    'bepari goli mogbazar': 'Moghbazar',
    'basila mohammadpur': 'Mohammadpur (Dhaka)',
    basaboo: 'Bashabo',
    banglabazar: 'Bangla Bazar',
    'azimpur lalbagh': 'Azimpur',
    'alu bazar boro masjid': 'Alubazar',
    gafargaon: 'Goffargaon',
    'indira road farmgate': 'Indira Road',
    'kolabagan 3rd lane': 'Kalabagan',
    'kesharpar senbagh dighirpaar': 'Senbag',
    'purbachal 300ft': '300 Feet',
    'shekertek mohammadpur': 'Shekhertek',
    'taltola noksha bari': 'Taltola (Mirpur)',
    cantornment: 'Dhaka Cantonment',
    cantonment: 'Dhaka Cantonment',
    'dhaka cantonment sena bhobon area': 'Dhaka Cantonment',
    jessore: 'Jessore Sadar',
    'demra matuil': 'Demra',
    'aftab nogor': 'Aftabnagar',
    'banani dohs old': 'Banani DOHS',
    'johuri moholla mohammadpur': 'Mohammadpur (Dhaka)',
    'south kuril joar shahara': 'Joar Shahara',
    arambagh: 'Arambag (Motijheel)',
    'oxygen quash road': 'Chattogram Oxygen',
    'hemayetpur is located in savar': 'Hemayetpur',
    'kodomtoli model town block a': 'Kodomtoli(Keraniganj)',
    jummapara: 'Jummapara',
    'বিশ্বরোড': 'Bishwa Road',
    'হেতমখাঁ লিচুবাগান': 'Rajpara',
    'হেতমখা লিচুবাগান': 'Rajpara',
    'নর্দান মোড়': 'Nordan More',
    'টাউন হল মোড় ময়মনসিংহ সদর': 'Town Hall Mor (Mymensingh)',
    'baridhara j block bashtola gulshan dhaka 1212': 'Bashtola',
    'barontek dhaka cantonment ecb pallabi thana': 'Barontek',
    'nandipara khilgaon dhaka': 'Nandipara',
    'baridhara j block vatara thana': 'Baridhara',
    'khuriapara matuail jatrabari': 'Matuail',
    'bhuter goli north circular road': 'Lalbagh',
    'west rajabazar panthapath': 'Panthopath',
    'barishal bus stand sadar barishal divison wather office': 'Barisal Sadar',
    'gorachad das road barishal city': 'Barisal Sadar',
    'oli market matobbor mor 60 feet': 'Mirpur 60 feet',
    'tejpata goli bakshi bazar': 'Bakshibazar',
    'opposite of jamuna future park': 'Bashundhara R/A',
    'wazuddin road natun bazar': 'Notun Bazar',
    '23 west nakhalpara tejgaon': 'Nakhalpara',
    'shahjahanpur khilgaon bagicha': 'Shahjahanpur',
    'hossaini dalan road': 'Puran Dhaka',
    'jatrabari jurain muradpur': 'Jurain',
    'dhour turag uttara dhaka': 'Dhour',
    'shantibag nur mosjid malibag dhaka': 'Shantibag',
    'zakir hossain road by lane': 'Halishahar',
    'b block s club mor halisohor chittagong': 'Halishahar',
    'or nizam road r a road 11': 'Nasirabad',
    'new chasara road jamtola': 'Chashara (Narayanganj)',
    'mauna bhavanipur bazar': 'Mawna',
    'maniknogor pakarmor': 'Manik Nagar',
    bhashantek: 'Vashantek',
    bansni: 'Banasree (Rampura)',
    ekuria: 'Zinzira',
    'west rasulpur': 'Kamrangichar',
    'purba rosulpur': 'Kamrangichar',
    dinajpur: 'Dinajpur Sadar',
    'এম এ জি ওসমানী মেডিকেল কলেজ': 'MAG Osmani Medical College',
    chanmari: 'Chanmari',
    collegepara: 'Collegepara (Brahmanbaria)',
    'savar cantonment mp check post anowara school savar dhaka': 'Savar',
    'monsurabad housing': 'Monsurabad',
    'aturardipu mainroad chittagong': 'Aturardipu',
    'boundary rod': 'Boundary Road',
    '5 rastar more': 'Jamalpur Sadar',
    'b block majhira cantonment': 'Majhira',
    'ideal mor r k road': 'Rangpur Sadar',
    'co bazar sardarpara': 'Rangpur Sadar',
    'naruli bogura sadar': 'Bogra Sadar',
    'pobohati citimore': 'Jhenaidah Sadar',
};
// district-scoped area aliases (override the global ones for that district only)
const districtAreaAliases = {
    Barisal: { banglabazar: 'Barisal Sadar', rupatoli: 'Barisal Sadar' },
    Narayanganj: { mouchak: 'Chashara (Narayanganj)' },
    Chittagong: {
        'enayet bazar': 'Chattogram New Market',
        'jamal khan': 'Chattogram GPO',
        'cda1 akborsha': 'Chattogram Oxygen',
    },
    Rajbari: { jangol: 'Rajbari Sadar' },
    Jessore: { 'nirala road': 'Jessore Sadar' },
    Dhaka: { airport: 'Kawla' },
    Bogra: { sobujbag: 'Bogra Sadar' },
    'sector 9 uttara dhaka 1230': 'Uttara Sector - 9',
    'sector 12 uttara': 'Uttara Sector - 12',
    'uttara rupayan city': 'Uttara',
    'uttara east': 'Uttara',
    'priyanka runway city uttara': 'Uttara',
    'uttara metro north and center er majhe 3 no bridge er kache': 'Uttara',
    siddheshwari: 'Shiddheswari',
    siddeshwari: 'Shiddheswari',
    shiddeshwari: 'Shiddheswari',
    siddeswary: 'Shiddheswari',
    'siddheswari lane': 'Shiddheswari',
    'siddheshwari road': 'Shiddheswari',
    'siddeshwari road': 'Shiddheswari',
    shaymoli: 'Shyamoli',
    shamoly: 'Shyamoli',
    'shamoly adabor': 'Shyamoli',
    'shaymoli dhaka': 'Shyamoli',
    'shyamoli ring road': 'Shyamoli',
    'segun bagicha': 'Shegunbagicha',
    'shegun bagicha': 'Shegunbagicha',
    'segunbagicha dhaka': 'Shegunbagicha',
    'nikunjo 2 dhaka 1229': 'Nikunja 2',
    'nikunjo 2 dhaka': 'Nikunja 2',
    'nikunja khilkhet': 'Nikunja',
    jigatola: 'Jhigatola',
    'gulshan 2': 'Gulshan',
    'mough bazar': 'Moghbazar',
    'ramna moghbazar': 'Moghbazar',
    'modhubagh moghbazar': 'Modhubagh',
    kolyanpur: 'Kallyanpur',
    pallobi: 'Pallabi',
    'pallabi west side of pallabi mertorail station': 'Pallabi',
    shabujbagh: 'Sabujbag',
    sabuzbagh: 'Sabujbag',
    sobujbag: 'Sabujbag',
    tejgoan: 'Tejgaon',
    'west nakhalpara tejgaon': 'Nakhalpara',
    'tejkunipara wasa pump tejgaon': 'Tejkunipara',
    chawakbazar: 'Chawkbazar (Dhaka)',
    'chawk bazar': 'Chawkbazar (Dhaka)',
    'chawkh bazar': 'Chawkbazar (Dhaka)',
    'kawla dakhil madrasha road dakshinkhan': 'Dakshinkhan',
    'kamar para turag dhaka 1230': 'Kamarpara',
    'malibari kholil master masjid rod matuail jatrabari dhaka': 'Matuail',
    mirpiur: 'Mirpur',
    mohammodpur: 'Mohammadpur (Dhaka)',
    'mohammed pur': 'Mohammadpur (Dhaka)',
    'north badda': 'Uttor Badda',
    'nurjahan road mohammadpur dhaka': 'Nurjahan Road',
    mohammedpur: 'Mohammadpur (Dhaka)',
    'bangabhaban 4no gate dilkusha': 'Chawkbazar (Dhaka)',
};
function matchDistrictPasses(raw) {
    const n = norm(raw);
    if (!n)
        return null;
    if (districtAliases[n])
        return districtAliases[n];
    const bn = n
        .replace(/[০-৯0-9]+/g, ' ')
        .replace(/\b(সদর|শহর)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (banglaDistrictAliases[bn])
        return banglaDistrictAliases[bn];
    const bnFirst = bn.split(' ')[0];
    if (banglaDistrictAliases[bnFirst])
        return banglaDistrictAliases[bnFirst];
    const exact = districtByNorm.get(n);
    if (exact)
        return exact;
    const stripped = n.replace(/\b(city|district|sadar|sodor)\b/g, '').trim();
    if (districtAliases[stripped])
        return districtAliases[stripped];
    if (districtByNorm.get(stripped))
        return districtByNorm.get(stripped);
    const noPostcode = tokens(n)
        .filter((t) => !/^\d{4}$/.test(t))
        .join(' ');
    return districtByNorm.get(noPostcode) ?? null;
}
// Long free-text areas: split into segments and keep the single area that matches
function matchSegments(district, city, area) {
    const n = norm(area);
    if (!n || n.split(' ').length < 2)
        return null;
    const found = new Set();
    for (const seg of area.split(/[,.;•|]/)) {
        const sn = norm(seg);
        if (!sn)
            continue;
        if (globalAreaIndex.has(sn)) {
            globalAreaIndex.get(sn).forEach((c) => found.add(c.district + '|' + c.area));
            continue;
        }
        const t = tokens(sn).map((w) => banglaTokenAliases[w] ?? w);
        if (!t.length)
            continue;
        for (const [key, list] of globalAreaIndex) {
            const kt = key.split(' ');
            if (kt.length && kt.every((w) => t.includes(w)))
                list.forEach((c) => found.add(c.district + '|' + c.area));
            else if (t.length >= 2 && t.every((w) => kt.includes(w)))
                list.forEach((c) => found.add(c.district + '|' + c.area));
        }
    }
    // never override a valid district with a segment match from another district
    if (district)
        [...found].forEach((k) => {
            if (!k.startsWith(district + '|'))
                found.delete(k);
        });
    // ignore generic single-word candidates like plain "Sadar"
    [...found].forEach((k) => {
        const a = k.split('|')[1];
        if (norm(a).split(' ').length === 1 && /^(sadar|dhaka|paltan|model town|airport)$/.test(norm(a)))
            found.delete(k);
    });
    if (found.size === 1) {
        const [d, a] = [...found][0].split('|');
        return { district: d, area: a };
    }
    return null;
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
    const dAlias = districtAreaAliases[district] && districtAreaAliases[district][n];
    if (dAlias)
        return dAlias;
    if (banglaAreaAliases[n])
        return banglaAreaAliases[n];
    const t = tokens(n).map((w) => banglaTokenAliases[w] ?? w);
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
        if (d < bestDist && n.length >= 8) {
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
        if (a)
            return { district, area: a };
    }
    // city failed to resolve: try the area text directly against all areas
    if (!district) {
        const areaKey = norm(area);
        if (areaKey && globalAreaIndex.has(areaKey)) {
            const cands = globalAreaIndex.get(areaKey);
            if (cands.length === 1)
                return { district: cands[0].district, area: cands[0].area };
        }
        const n = norm(city);
        if (!n)
            return null;
        const asArea = globalAreaIndex.get(n) ?? [...globalAreaIndex.entries()].find(([k]) => k.startsWith(n + ' '))?.[1];
        if (asArea && asArea.length === 1) {
            const { district: d2, area: canonical } = asArea[0];
            const a = matchArea(d2, area);
            if (a)
                return { district: d2, area: a };
            // fall back to the area implied by the city only when no real area text exists
            if (!norm(area) || norm(area) === norm(city))
                return { district: d2, area: canonical };
        }
    }
    return matchSegments(district, city, area);
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
    if (!apply && updates.length) {
        console.log('\n--- Planned updates (old -> new) ---');
        const byOriginal = new Map(rows.map((r) => [r.id, r]));
        for (const u of updates) {
            const r = byOriginal.get(u.id);
            console.log(`id=${u.id} user=${r.user_id} city "${r.city}" area "${r.area}" -> city "${u.city}" area "${u.area}"`);
        }
    }
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
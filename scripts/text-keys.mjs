// Lists every translatable string on the site with the section it appears in, for the admin Texts editor.
import fs from "node:fs";
const src = fs.readFileSync("src/App.tsx", "utf8") + "\n{/* PAGES */}\n" + fs.readFileSync("src/Shell.tsx", "utf8") + fs.readFileSync("src/NewsPage.tsx", "utf8");
const i18n = fs.readFileSync("src/i18n.ts", "utf8");
const AZ = {};
for (const m of i18n.matchAll(/^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*"),?\s*$/gm)) AZ[JSON.parse(m[1])] = JSON.parse(m[2]);
const NAMES = { NAV: "Header & menu", HERO: "Hero", "PHONE STAGE": "Hero", "FLOATING PIECES": "Hero", "TRUST BAND": "Sponsors", "HOW IT WORKS": "How it works", FEATURES: "Features", "PARTNER CENTERS": "Partners map", "FOR SERVICE CENTERS": "For service centers", NEWS: "News", TEAM: "Team", INSTAGRAM: "Follow strip", FOOTER: "Footer", PAGES: "Other pages" };
let section = "Header & menu";
const seen = new Map();
const re = /\{\/\* ([A-Z][A-Z &]+) \*\/\}|\bt\("((?:[^"\\]|\\.)*)"\)/g;
for (const m of src.matchAll(re)) {
  if (m[1]) { section = NAMES[m[1].trim()] ?? section; continue; }
  const key = JSON.parse(`"${m[2]}"`);
  if (/^\d+$/.test(key) || seen.has(key)) continue;
  seen.set(key, { key, section, az: AZ[key] ?? "" });
}
const list = [...seen.values()];
fs.writeFileSync("src/admin/text-keys.json", JSON.stringify(list, null, 1) + "\n");
console.log(`text keys: ${list.length}`);

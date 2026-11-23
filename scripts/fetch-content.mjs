// Pulls the latest content from Supabase into src/content/content.json before the build.
// In CI a failed fetch stops the deploy, so the live site never falls back to stale content.
import fs from "node:fs";
const cfg = JSON.parse(fs.readFileSync("src/supabase-config.json", "utf8"));
const out = "src/content/content.json";
const get = async (table, query = "select=*") => {
  const r = await fetch(`${cfg.url}/rest/v1/${table}?${query}`, { headers: { apikey: cfg.publishableKey, Authorization: `Bearer ${cfg.publishableKey}` } });
  if (!r.ok) throw new Error(`${table}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
};
const strip = (rows) => rows.map(({ updated_at, ...rest }) => rest);
try {
  const [news, team, orgs, centers, texts, settings] = await Promise.all([
    get("news", "select=*&published=eq.true"), get("team"), get("orgs"), get("centers"), get("texts"), get("settings"),
  ]);
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));
  const content = {
    news: strip(news),
    team: strip(team),
    orgs: strip(orgs).map(clean),
    centers: strip(centers),
    texts: Object.fromEntries(texts.map((t) => [t.key, clean({ en: t.en || null, az: t.az || null })])),
    hidden: settings.find((s) => s.key === "hidden")?.value ?? [],
  };
  fs.writeFileSync(out, JSON.stringify(content, null, 2) + "\n");
  console.log(`content: ${news.length} news, ${team.length} team, ${orgs.length} orgs, ${centers.length} centers, ${texts.length} text overrides`);
} catch (e) {
  if (process.env.CI) {
    console.error("Could not load content from Supabase:", e.message);
    process.exit(1);
  }
  console.warn("Supabase unreachable, building with the committed content.json:", e.message);
}

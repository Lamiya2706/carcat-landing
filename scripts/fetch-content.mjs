// Pulls the last *published* content snapshot from Supabase into src/content/content.json before the build,
// so a deploy always matches what visitors already see live. In CI a failed fetch stops the deploy.
import fs from "node:fs";
const cfg = JSON.parse(fs.readFileSync("src/supabase-config.json", "utf8"));
const out = "src/content/content.json";
try {
  const r = await fetch(`${cfg.url}/rest/v1/settings?key=eq.published&select=value`, {
    headers: { apikey: cfg.publishableKey, Authorization: `Bearer ${cfg.publishableKey}` },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const snap = (await r.json())[0]?.value;
  if (!snap?.version) throw new Error("no published snapshot yet");
  fs.writeFileSync(out, JSON.stringify(snap, null, 2) + "\n");
  console.log(`content ${snap.version}: ${snap.news.length} news, ${snap.team.length} team, ${snap.orgs.length} orgs, ${snap.centers.length} centers, ${Object.keys(snap.texts).length} text overrides`);
} catch (e) {
  if (process.env.CI) {
    console.error("Could not load content from Supabase:", e.message);
    process.exit(1);
  }
  console.warn("Supabase unreachable, building with the committed content.json:", e.message);
}

// Loads the latest *published* content snapshot from Supabase, so a Publish shows up for visitors
// within seconds, without waiting for the GitHub rebuild or the 10-minute GitHub Pages cache.
import cfg from "./supabase-config.json";
import { CONTENT, applyContent, type Content } from "./content";

let started = false;
export function loadLiveContent() {
  if (started || typeof window === "undefined") return;
  started = true;
  const url = `${cfg.url}/rest/v1/settings?key=eq.published&select=value`;
  fetch(url, { headers: { apikey: cfg.publishableKey, Authorization: `Bearer ${cfg.publishableKey}` } })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: { value: Content }[]) => {
      const snap = rows[0]?.value;
      if (snap?.version && snap.version !== CONTENT.version) applyContent(snap);
    })
    .catch(() => {
      /* offline or Supabase down: the built-in content stays */
    });
}

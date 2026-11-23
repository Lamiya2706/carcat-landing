// Admin-only: triggers the GitHub Pages deploy (which pulls fresh content from Supabase) and reports its status.
import { createClient } from "npm:@supabase/supabase-js@2";

const REPO = "Lamiya2706/carcat-landing";
const WORKFLOW = "deploy.yml";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: admin } = await db.rpc("is_admin");
  if (!admin) return json({ error: "Not an admin" }, 403);

  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) return json({ error: "GITHUB_TOKEN secret is not set in Supabase" }, 500);
  const gh = (path: string, init: RequestInit = {}) =>
    fetch(`https://api.github.com/repos/${REPO}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "carcat-admin" },
    });

  const { action } = await req.json().catch(() => ({ action: "status" }));

  if (action === "publish") {
    const r = await gh(`/actions/workflows/${WORKFLOW}/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main" }) });
    if (!r.ok) return json({ error: `GitHub ${r.status}: ${await r.text()}` }, 502);
    await db.from("settings").upsert({ key: "last_publish", value: new Date().toISOString(), updated_at: new Date().toISOString() });
    return json({ ok: true });
  }

  // status: latest deploy run + how many rows changed since the last publish
  const { data: lp } = await db.from("settings").select("value").eq("key", "last_publish").maybeSingle();
  const since = (lp?.value as string) ?? "1970-01-01T00:00:00Z";
  const counts = await Promise.all(
    ["news", "team", "orgs", "centers", "texts"].map((t) => db.from(t).select("*", { count: "exact", head: true }).gt("updated_at", since)),
  );
  const { data: hid } = await db.from("settings").select("updated_at").eq("key", "hidden").gt("updated_at", since);
  const pending = counts.reduce((n, c) => n + (c.count ?? 0), 0) + (hid?.length ?? 0);
  const r = await gh(`/actions/workflows/${WORKFLOW}/runs?per_page=1`);
  const run = r.ok ? (await r.json()).workflow_runs?.[0] : undefined;
  return json({ status: run?.status, conclusion: run?.conclusion, created_at: run?.created_at, url: run?.html_url, last_publish: lp?.value ?? null, pending });
});

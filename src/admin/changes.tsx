import { useCallback, useEffect, useState } from "react";
import { mediaUrl, sb } from "./supabase";
import { Btn, PageHead, notifyChanged, toast } from "./ui";
import { Empty, Loading } from "./pages";


type Kind = "news" | "team" | "orgs" | "centers" | "texts" | "hidden";
export type Change = {
  id: string;
  kind: Kind;
  key: string;
  status: "added" | "edited" | "deleted";
  title: string;
  image?: string;
  details: { label: string; before?: string; after?: string }[];
  /** row as published (to restore), or undefined when the item is new */
  published?: any;
};

const KIND_LABEL: Record<Kind, string> = { news: "News", team: "Team", orgs: "Sponsors & partners", centers: "Service centers", texts: "Section texts", hidden: "Sections" };
const TABLE_KEY: Record<string, string> = { news: "slug", team: "id", orgs: "id", centers: "id" };
const NULLABLE: Record<string, string[]> = { orgs: ["scale"] };

const FIELD_LABEL: Record<string, string> = {
  "en.title": "Title (EN)", "az.title": "Title (AZ)", "en.lead": "Lead (EN)", "az.lead": "Lead (AZ)", "en.body": "Body (EN)", "az.body": "Body (AZ)",
  date: "Date", image: "Cover image", fit: "Image fit", alt: "Image description", published: "Published", sort: "Order", slug: "Link",
  name: "Name", photo: "Photo", "role.en": "Role (EN)", "role.az": "Role (AZ)", linkedin: "LinkedIn", visible: "Shown on site",
  kind: "Group", logo: "Logo", url: "Website", tall: "Tall logo", scale: "Logo size", "category.en": "Category (EN)", "category.az": "Category (AZ)", soon: "Coming soon", locations: "Locations",
};

const clean = (o: any): Record<string, any> => {
  const { updated_at, ...rest } = o ?? {};
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null && v !== undefined));
};
const show = (v: any): string =>
  v === undefined || v === null ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : Array.isArray(v) ? (typeof v[0] === "string" ? v.join(" ¶ ") : v.map((l: any) => l?.district?.en ?? JSON.stringify(l)).join(", ")) : typeof v === "object" ? JSON.stringify(v) : String(v);
const isImg = (f: string) => ["image", "photo", "logo"].includes(f);

/** Field-by-field differences, one level into {en, az} objects. */
function diffFields(a: any, b: any) {
  const out: Change["details"] = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k], y = b[k];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (x && y && typeof x === "object" && !Array.isArray(x) && typeof y === "object" && !Array.isArray(y)) {
      for (const sub of new Set([...Object.keys(x), ...Object.keys(y)]))
        if (JSON.stringify(x[sub]) !== JSON.stringify(y[sub])) out.push({ label: FIELD_LABEL[`${k}.${sub}`] ?? `${k}.${sub}`, before: show(x[sub]), after: show(y[sub]) });
    } else out.push({ label: FIELD_LABEL[k] ?? k, before: isImg(k) ? "image:" + (x ?? "") : show(x), after: isImg(k) ? "image:" + (y ?? "") : show(y) });
  }
  return out;
}

const titleOf = (kind: Kind, r: any) => (kind === "news" ? r.en?.title : r.name) || r.slug || r.id;
const imageOf = (kind: Kind, r: any) => (kind === "news" ? r.image : kind === "team" ? r.photo : r.logo);

/** Compares the editable tables with the last published snapshot. */
export async function loadChanges(): Promise<Change[]> {
  const [snapRes, ...tables] = await Promise.all([
    sb.from("settings").select("key,value").in("key", ["published", "hidden"]),
    sb.from("news").select("*"),
    sb.from("team").select("*"),
    sb.from("orgs").select("*"),
    sb.from("centers").select("*"),
    sb.from("texts").select("*"),
  ]);
  const err = [snapRes, ...tables].find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  const snap = snapRes.data!.find((r) => r.key === "published")?.value ?? { news: [], team: [], orgs: [], centers: [], texts: {}, hidden: [] };
  const hiddenNow = (snapRes.data!.find((r) => r.key === "hidden")?.value as string[]) ?? [];
  const [news, team, orgs, centers, texts] = tables.map((t) => t.data as any[]);
  const out: Change[] = [];

  const rows: [Kind, any[], any[]][] = [["news", news, snap.news], ["team", team, snap.team], ["orgs", orgs, snap.orgs], ["centers", centers, snap.centers]];
  for (const [kind, now, pub] of rows) {
    const key = TABLE_KEY[kind];
    const pubBy = new Map<string, Record<string, any>>(pub.map((r: any) => [r[key], clean(r)]));
    for (const r0 of now) {
      const r = clean(r0);
      const p = pubBy.get(r[key]);
      pubBy.delete(r[key]);
      // drafts that were never published don't touch the site
      if (kind === "news" && !r.published && !p) continue;
      if (!p) {
        out.push({ id: `${kind}:${r[key]}`, kind, key: r[key], status: "added", title: titleOf(kind, r), image: imageOf(kind, r), details: [] });
        continue;
      }
      // a published post switched to draft disappears from the site
      if (kind === "news" && !r.published) {
        out.push({ id: `${kind}:${r[key]}`, kind, key: r[key], status: "deleted", title: titleOf(kind, r), image: imageOf(kind, r), details: [{ label: "Published", before: "Yes", after: "No (draft)" }], published: p });
        continue;
      }
      const d = diffFields(p, r);
      if (d.length) out.push({ id: `${kind}:${r[key]}`, kind, key: r[key], status: "edited", title: titleOf(kind, r), image: imageOf(kind, r), details: d, published: p });
    }
    for (const [k, p] of pubBy) out.push({ id: `${kind}:${k}`, kind, key: k as string, status: "deleted", title: titleOf(kind, p), image: imageOf(kind, p), details: [], published: p });
  }

  const pubTexts: Record<string, Record<string, string>> = snap.texts ?? {};
  const nowTexts = new Map<string, Record<string, string>>(texts.map((t: any) => [t.key, clean({ en: t.en || null, az: t.az || null })]));
  for (const k of new Set([...Object.keys(pubTexts), ...nowTexts.keys()])) {
    const p = pubTexts[k] ? clean(pubTexts[k]) : undefined;
    const n = nowTexts.get(k);
    if (JSON.stringify(p ?? {}) === JSON.stringify(n ?? {})) continue;
    const details = (["en", "az"] as const)
      .filter((l) => (p?.[l] ?? "") !== (n?.[l] ?? ""))
      .map((l) => ({ label: l.toUpperCase(), before: p?.[l] ?? "(original text)", after: n?.[l] ?? "(original text)" }));
    out.push({ id: `texts:${k}`, kind: "texts", key: k, status: "edited", title: k, details, published: p ?? null });
  }

  const ph: string[] = snap.hidden ?? [];
  if (JSON.stringify([...ph].sort()) !== JSON.stringify([...hiddenNow].sort()))
    out.push({ id: "hidden", kind: "hidden", key: "hidden", status: "edited", title: "Hidden sections", details: [{ label: "Hidden", before: ph.join(", ") || "none", after: hiddenNow.join(", ") || "none" }], published: ph });

  return out;
}

/** Puts one item back exactly as it was at the last publish. */
export async function revertChange(c: Change) {
  const now = new Date().toISOString();
  let error: any;
  if (c.kind === "texts") {
    ({ error } = c.published
      ? await sb.from("texts").upsert({ key: c.key, en: c.published.en ?? null, az: c.published.az ?? null, updated_at: now })
      : await sb.from("texts").delete().eq("key", c.key));
  } else if (c.kind === "hidden") {
    ({ error } = await sb.from("settings").upsert({ key: "hidden", value: c.published, updated_at: now }));
  } else if (c.status === "added") {
    ({ error } = await sb.from(c.kind).delete().eq(TABLE_KEY[c.kind], c.key));
  } else {
    const row = { ...c.published, updated_at: now };
    for (const f of NULLABLE[c.kind] ?? []) if (!(f in row)) row[f] = null;
    ({ error } = await sb.from(c.kind).upsert(row));
  }
  if (error) throw new Error(error.message);
  notifyChanged();
}

/** Live list of unpublished changes; reloads after any save. */
export function useChanges(intervalMs = 30000) {
  const [list, setList] = useState<Change[] | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    loadChanges().then(setList, (e) => setError(e.message));
  }, []);
  useEffect(() => {
    reload();
    window.addEventListener("cms-changed", reload);
    const id = setInterval(reload, intervalMs);
    return () => {
      window.removeEventListener("cms-changed", reload);
      clearInterval(id);
    };
  }, [reload, intervalMs]);
  return { list, error, reload };
}

const STATUS = { added: ["New", "on"], edited: ["Edited", "warn"], deleted: ["Removed", "off"] } as const;

export function ChangesPage() {
  const { list, error } = useChanges(15000);
  const [busy, setBusy] = useState<string | null>(null);
  const revert = async (c: Change) => {
    const what = c.status === "added" ? `Delete the new item “${c.title}”? It was never published.` : `Put “${c.title}” back to how it is on the live site?`;
    if (!confirm(what)) return;
    setBusy(c.id);
    try {
      await revertChange(c);
      toast("Reverted");
    } catch (e: any) {
      toast(e.message, "err");
    }
    setBusy(null);
  };
  const revertAll = async () => {
    if (!list?.length || !confirm(`Revert all ${list.length} changes? Everything goes back to the live site's version.`)) return;
    setBusy("all");
    try {
      for (const c of list) await revertChange(c);
      toast("All changes reverted");
    } catch (e: any) {
      toast(e.message, "err");
    }
    setBusy(null);
  };
  const groups = (Object.keys(KIND_LABEL) as Kind[]).map((k) => [k, (list ?? []).filter((c) => c.kind === k)] as const).filter(([, l]) => l.length);
  return (
    <>
      <PageHead title="Unpublished changes" sub="Everything saved since the last Publish. Revert anything you don't want to go live; the rest goes out when you press Publish.">
        {!!list?.length && <Btn kind="danger" disabled={!!busy} onClick={revertAll}>Revert all</Btn>}
      </PageHead>
      {error ? <Empty>{error}</Empty> : !list ? <Loading /> : !list.length ? (
        <Empty>Nothing to publish. The live site matches the admin.</Empty>
      ) : (
        groups.map(([kind, items]) => (
          <section key={kind} className="ad-group">
            <div className="ad-group-head"><div><h2>{KIND_LABEL[kind]}</h2></div></div>
            <div className="ad-list">
              {items.map((c) => (
                <div key={c.id} className="ad-change">
                  <div className="ad-change-head">
                    {c.image && <img className="ad-thumb contain" src={mediaUrl(c.image)} alt="" />}
                    <div className="ad-item-main"><strong>{c.title}</strong></div>
                    <span className={"ad-pill " + STATUS[c.status][1]}>{STATUS[c.status][0]}</span>
                    <Btn disabled={!!busy} onClick={() => revert(c)}>{busy === c.id ? "…" : "Revert"}</Btn>
                  </div>
                  {!!c.details.length && (
                    <div className="ad-diff">
                      {c.details.map((d, i) => (
                        <div key={i} className="ad-diff-row">
                          <span className="ad-diff-label">{d.label}</span>
                          <Val v={d.before} cls="before" />
                          <span className="ad-diff-arrow">→</span>
                          <Val v={d.after} cls="after" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

const Val = ({ v, cls }: { v?: string; cls: string }) =>
  v?.startsWith("image:") ? (
    <span className={"ad-diff-val " + cls}>{v.length > 6 ? <img src={mediaUrl(v.slice(6))} alt="" /> : "—"}</span>
  ) : (
    <span className={"ad-diff-val " + cls}>{v && v.length > 220 ? v.slice(0, 220) + "…" : v}</span>
  );

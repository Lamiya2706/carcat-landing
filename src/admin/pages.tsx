import { useEffect, useMemo, useRef, useState } from "react";
import { mediaUrl, sb, slugify } from "./supabase";
import { markDeleted, notifyChanged, Bilingual, Btn, Drawer, Field, ImagePick, PageHead, Reorder, Text, Toggle, toast, useTable, type Row } from "./ui";
import TEXT_KEYS from "./text-keys.json";

const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const L = { en: "", az: "" };

/* ───────────── News ───────────── */

type News = Row & { slug: string; date: string; image: string; fit: "cover" | "contain"; alt: string; published: boolean; en: { title: string; lead: string; body: string[] }; az: { title: string; lead: string; body: string[] } };
const paras = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function NewsPage() {
  const t = useTable<News>("news", "slug");
  const [edit, setEdit] = useState<{ row: News; prev?: string } | null>(null);
  const blank = (): News => ({ slug: "", date: new Date().toISOString().slice(0, 10), image: "", fit: "cover", alt: "", published: false, sort: -1, en: { title: "", lead: "", body: [] }, az: { title: "", lead: "", body: [] } });
  return (
    <>
      <PageHead title="News" sub="Posts on the homepage carousel and the news pages, in this order.">
        <Btn kind="primary" onClick={() => setEdit({ row: blank() })}>+ New post</Btn>
      </PageHead>
      {t.loading ? <Loading /> : (
        <div className="ad-list">
          {t.rows.map((n, i) => (
            <div key={n.slug} className="ad-item" onClick={() => setEdit({ row: n, prev: n.slug })}>
              <img className={"ad-thumb" + (n.fit === "contain" ? " contain" : "")} src={mediaUrl(n.image)} alt="" />
              <div className="ad-item-main">
                <strong>{n.en.title || "(untitled)"}</strong>
                <span>{fmtDate(n.date)} · /news/{n.slug}/</span>
              </div>
              <span className={"ad-pill " + (n.published ? "on" : "off")}>{n.published ? "Published" : "Draft"}</span>
              <span onClick={(e) => e.stopPropagation()}><Reorder first={i === 0} last={i === t.rows.length - 1} onUp={() => t.move(t.rows, i, -1)} onDown={() => t.move(t.rows, i, 1)} /></span>
            </div>
          ))}
          {!t.rows.length && <Empty>No posts yet.</Empty>}
        </div>
      )}
      {edit && (
        <Drawer
          title={edit.prev ? "Edit post" : "New post"}
          initial={edit.row}
          onClose={() => setEdit(null)}
          onSave={async (d) => {
            if (!d.en.title.trim()) throw new Error("Add an English title");
            if (!d.image) throw new Error("Add a cover image");
            const slug = d.slug || slugify(d.en.title);
            if (!edit.prev && t.rows.some((r) => r.slug === slug)) throw new Error("A post with this link already exists; change the link");
            const sort = d.sort < 0 ? Math.min(0, ...t.rows.map((r) => r.sort)) - 1 : d.sort;
            await t.save({ ...d, slug, sort, alt: d.alt || d.en.title }, edit.prev);
          }}
          onDelete={edit.prev ? () => t.remove(edit.prev!) : undefined}
        >
          {(d, set) => (
            <div className="ad-grid">
              <Bilingual label="Title" value={{ en: d.en.title, az: d.az.title }} onChange={(v) => set({ en: { ...d.en, title: v.en }, az: { ...d.az, title: v.az } })} />
              <Bilingual label="Lead" area rows={3} value={{ en: d.en.lead, az: d.az.lead }} onChange={(v) => set({ en: { ...d.en, lead: v.en }, az: { ...d.az, lead: v.az } })} hint="The first paragraph, also used as the Google / share description." />
              <BodyField d={d} set={set} />
              <ImagePick label="Cover image" folder="news" value={d.image} contain={d.fit === "contain"} onChange={(image) => set({ image })} />
              <div className="ad-stack">
                <Field label="Date"><Text type="date" value={d.date} onChange={(date) => set({ date })} /></Field>
                <Field label="Image fit">
                  <div className="ad-seg">
                    <button type="button" className={d.fit === "cover" ? "on" : ""} onClick={() => set({ fit: "cover" })}>Photo (fill)</button>
                    <button type="button" className={d.fit === "contain" ? "on" : ""} onClick={() => set({ fit: "contain" })}>Logo / document</button>
                  </div>
                </Field>
                <Field label="Link" hint={edit.prev ? "Changing it breaks links already shared." : "Made from the English title if left empty."}>
                  <Text value={d.slug} placeholder={slugify(d.en.title) || "my-post"} onChange={(s) => set({ slug: slugify(s) })} />
                </Field>
                <Toggle label="Published" checked={d.published} onChange={(published) => set({ published })} />
              </div>
              <Field label="Image description (for screen readers)" wide><Text value={d.alt} placeholder={d.en.title} onChange={(alt) => set({ alt })} /></Field>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}

function BodyField({ d, set }: { d: News; set: (p: Partial<News>) => void }) {
  // keep raw text while typing so blank lines aren't swallowed
  const [en, setEn] = useState(d.en.body.join("\n\n"));
  const [az, setAz] = useState(d.az.body.join("\n\n"));
  return (
    <Bilingual
      label="Body"
      area
      rows={9}
      value={{ en, az }}
      onChange={(v) => {
        setEn(v.en);
        setAz(v.az);
        set({ en: { ...d.en, body: paras(v.en) }, az: { ...d.az, body: paras(v.az) } });
      }}
      hint="Leave an empty line between paragraphs."
    />
  );
}

/* ───────────── Team ───────────── */

type Member = Row & { id: string; name: string; photo: string; role: { en: string; az: string }; linkedin: string; visible: boolean };

export function TeamPage() {
  const t = useTable<Member>("team");
  const [edit, setEdit] = useState<Member | null>(null);
  return (
    <>
      <PageHead title="Team" sub="Founding team cards on the homepage.">
        <Btn kind="primary" onClick={() => setEdit({ id: "", name: "", photo: "", role: { ...L }, linkedin: "", visible: true, sort: t.rows.length })}>+ Add member</Btn>
      </PageHead>
      {t.loading ? <Loading /> : (
        <div className="ad-cards">
          {t.rows.map((m, i) => (
            <div key={m.id} className={"ad-card" + (m.visible ? "" : " hidden")} onClick={() => setEdit(m)}>
              <img src={mediaUrl(m.photo)} alt="" />
              <strong>{m.name}</strong>
              <span>{m.role.en}</span>
              <div className="ad-card-foot" onClick={(e) => e.stopPropagation()}>
                {!m.visible && <span className="ad-pill off">Hidden</span>}
                {!m.linkedin && <span className="ad-pill warn">No LinkedIn</span>}
                <span style={{ flex: 1 }} />
                <Reorder first={i === 0} last={i === t.rows.length - 1} onUp={() => t.move(t.rows, i, -1)} onDown={() => t.move(t.rows, i, 1)} />
              </div>
            </div>
          ))}
        </div>
      )}
      {edit && (
        <Drawer
          title={edit.id ? "Edit member" : "New member"}
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={async (d) => {
            if (!d.name.trim() || !d.photo) throw new Error("Name and photo are required");
            const row: any = { ...d };
            if (!row.id) delete row.id;
            await t.save(row);
          }}
          onDelete={edit.id ? () => t.remove(edit.id) : undefined}
        >
          {(d, set) => (
            <div className="ad-grid">
              <ImagePick label="Photo" folder="team" maxSide={900} value={d.photo} onChange={(photo) => set({ photo })} />
              <div className="ad-stack">
                <Field label="Name"><Text value={d.name} onChange={(name) => set({ name })} /></Field>
                <Field label="LinkedIn URL"><Text value={d.linkedin} placeholder="https://www.linkedin.com/in/…" onChange={(linkedin) => set({ linkedin })} /></Field>
                <Toggle label="Show on site" checked={d.visible} onChange={(visible) => set({ visible })} />
              </div>
              <Bilingual label="Role" value={d.role} onChange={(role) => set({ role })} />
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}

/* ───────────── Sponsors & partners ───────────── */

type Org = Row & { id: string; kind: "sponsor" | "partner"; name: string; logo: string; url: string; tall: boolean; scale: number | null; visible: boolean };

export function OrgsPage() {
  const t = useTable<Org>("orgs");
  const [edit, setEdit] = useState<Org | null>(null);
  const groups: { kind: Org["kind"]; title: string; sub: string }[] = [
    { kind: "sponsor", title: "Sponsors", sub: "“Backed by our sponsors” grid under the hero" },
    { kind: "partner", title: "Partners", sub: "“Working with our partners” scrolling strip" },
  ];
  return (
    <>
      <PageHead title="Sponsors & partners" sub="Logos link to each organisation's website." />
      {t.loading ? <Loading /> : groups.map((g) => {
        const list = t.rows.filter((o) => o.kind === g.kind);
        return (
          <section key={g.kind} className="ad-group">
            <div className="ad-group-head">
              <div><h2>{g.title}</h2><p>{g.sub}</p></div>
              <Btn onClick={() => setEdit({ id: "", kind: g.kind, name: "", logo: "", url: "", tall: false, scale: null, visible: true, sort: list.length })}>+ Add {g.kind}</Btn>
            </div>
            <div className="ad-logos">
              {list.map((o, i) => (
                <div key={o.id} className={"ad-logo" + (o.visible ? "" : " hidden")} onClick={() => setEdit(o)} title={o.name}>
                  <div className="ad-logo-img"><img src={mediaUrl(o.logo)} alt="" /></div>
                  <span>{o.name}</span>
                  <span onClick={(e) => e.stopPropagation()}><Reorder first={i === 0} last={i === list.length - 1} onUp={() => t.move(list, i, -1)} onDown={() => t.move(list, i, 1)} /></span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {edit && (
        <Drawer
          title={edit.id ? "Edit " + edit.kind : "New " + edit.kind}
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={async (d) => {
            if (!d.name.trim() || !d.logo) throw new Error("Name and logo are required");
            const row: any = { ...d };
            if (!row.id) delete row.id;
            await t.save(row);
          }}
          onDelete={edit.id ? () => t.remove(edit.id) : undefined}
        >
          {(d, set) => (
            <div className="ad-grid">
              <ImagePick label="Logo" folder="logos" contain maxSide={800} value={d.logo} onChange={(logo) => set({ logo })} />
              <div className="ad-stack">
                <Field label="Name"><Text value={d.name} onChange={(name) => set({ name })} /></Field>
                <Field label="Website"><Text value={d.url} placeholder="https://" onChange={(url) => set({ url })} /></Field>
                <Field label="Group">
                  <div className="ad-seg">
                    <button type="button" className={d.kind === "sponsor" ? "on" : ""} onClick={() => set({ kind: "sponsor" })}>Sponsor</button>
                    <button type="button" className={d.kind === "partner" ? "on" : ""} onClick={() => set({ kind: "partner" })}>Partner</button>
                  </div>
                </Field>
                <Toggle label="Tall logo (square or stacked emblem)" checked={d.tall} onChange={(tall) => set({ tall })} />
                <Toggle label="Show on site" checked={d.visible} onChange={(visible) => set({ visible })} />
              </div>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}

/* ───────────── Service centers + map ───────────── */

type Loc = { district: { en: string; az: string }; x: number; y: number; mapsQuery: string };
type Center = Row & { id: string; name: string; logo: string; category: { en: string; az: string }; soon: boolean; locations: Loc[]; visible: boolean };

function MiniMap({ pins, active, onPick }: { pins: { x: number; y: number; label: string; on: boolean }[]; active: number; onPick: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // same coordinate space as the draggable map layer on the site (percent of the whole map)
  return (
    <div
      ref={ref}
      className="ad-map"
      onClick={(e) => {
        const r = ref.current!.getBoundingClientRect();
        onPick(Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100));
      }}
    >
      <svg viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true">
        <rect width="600" height="420" fill="#eef0ea" />
        <path d="M0 300 C 80 290, 150 300, 210 318 C 260 334, 300 300, 350 290 C 410 278, 470 300, 520 270 C 560 250, 590 255, 600 250 L 600 420 L 0 420 Z" fill="#dbe8f7" />
        {[["BINAGADI", 150, 85], ["YASAMAL", 95, 240], ["NASIMI", 225, 175], ["NARIMANOV", 345, 120], ["KHATAI", 440, 205], ["NIZAMI", 505, 140], ["SABAIL", 285, 250], ["BAKU BAY", 300, 345]].map(([n, x, y]) => (
          <text key={n as string} x={x as number} y={y as number} fontSize="11" fontWeight="600" fill="#8a8f86" letterSpacing="1.5">{n}</text>
        ))}
      </svg>
      {pins.map((p, i) => (
        <span key={i} className={"ad-pin" + (i === active ? " active" : "") + (p.on ? "" : " soon")} style={{ left: p.x + "%", top: p.y + "%" }}>
          <em>{p.label}</em>
        </span>
      ))}
      <span className="ad-map-hint">Click the map to place the selected location</span>
    </div>
  );
}

export function CentersPage() {
  const t = useTable<Center>("centers");
  const [edit, setEdit] = useState<{ row: Center; prev?: string } | null>(null);
  return (
    <>
      <PageHead title="Service centers" sub="Brands on the “Already on CarCat” map. The map rotates through them in this order.">
        <Btn kind="primary" onClick={() => setEdit({ row: { id: "", name: "", logo: "", category: { ...L }, soon: false, locations: [], visible: true, sort: t.rows.length } })}>+ Add center</Btn>
      </PageHead>
      {t.loading ? <Loading /> : (
        <div className="ad-list">
          {t.rows.map((c, i) => (
            <div key={c.id} className={"ad-item" + (c.visible ? "" : " hidden")} onClick={() => setEdit({ row: c, prev: c.id })}>
              <img className="ad-thumb contain" src={mediaUrl(c.logo)} alt="" />
              <div className="ad-item-main">
                <strong>{c.name}</strong>
                <span>{c.category.en} · {c.locations.map((l) => l.district.en).join(", ") || "no locations"}</span>
              </div>
              {c.soon && <span className="ad-pill warn">Coming soon</span>}
              {!c.visible && <span className="ad-pill off">Hidden</span>}
              <span onClick={(e) => e.stopPropagation()}><Reorder first={i === 0} last={i === t.rows.length - 1} onUp={() => t.move(t.rows, i, -1)} onDown={() => t.move(t.rows, i, 1)} /></span>
            </div>
          ))}
        </div>
      )}
      {edit && (
        <Drawer
          title={edit.prev ? "Edit " + edit.row.name : "New service center"}
          initial={edit.row}
          onClose={() => setEdit(null)}
          onSave={async (d) => {
            if (!d.name.trim() || !d.logo) throw new Error("Name and logo are required");
            const id = d.id || slugify(d.name);
            if (!edit.prev && t.rows.some((r) => r.id === id)) throw new Error("This brand already exists");
            const locations = d.locations.map((l) => ({ ...l, mapsQuery: l.mapsQuery || `${d.name} ${l.district.en} Baku` }));
            await t.save({ ...d, id, locations }, edit.prev);
          }}
          onDelete={edit.prev ? () => t.remove(edit.prev!) : undefined}
        >
          {(d, set) => <CenterForm d={d} set={set} />}
        </Drawer>
      )}
    </>
  );
}

function CenterForm({ d, set }: { d: Center; set: (p: Partial<Center>) => void }) {
  const [active, setActive] = useState(0);
  const locs = d.locations;
  const setLoc = (i: number, patch: Partial<Loc>) => set({ locations: locs.map((l, n) => (n === i ? { ...l, ...patch } : l)) });
  const add = () => {
    set({ locations: [...locs, { district: { ...L }, x: 50, y: 45, mapsQuery: "" }] });
    setActive(locs.length);
  };
  return (
    <div className="ad-grid">
      <ImagePick label="Logo" folder="logos" contain maxSide={800} value={d.logo} onChange={(logo) => set({ logo })} />
      <div className="ad-stack">
        <Field label="Brand name"><Text value={d.name} onChange={(name) => set({ name })} /></Field>
        <Toggle label="Coming soon (dashed pin, “Soon” badge)" checked={d.soon} onChange={(soon) => set({ soon })} />
        <Toggle label="Show on site" checked={d.visible} onChange={(visible) => set({ visible })} />
      </div>
      <Bilingual label="Category" value={d.category} onChange={(category) => set({ category })} hint="e.g. Tire fitting / Təkər montajı" />
      <div className="ad-field wide">
        <span className="ad-label">Locations</span>
        <MiniMap pins={locs.map((l) => ({ x: l.x, y: l.y, label: l.district.en || "New", on: !d.soon }))} active={active} onPick={(x, y) => locs[active] && setLoc(active, { x, y })} />
        <div className="ad-locs">
          {locs.map((l, i) => (
            <div key={i} className={"ad-loc" + (i === active ? " active" : "")} onClick={() => setActive(i)}>
              <Text value={l.district.en} placeholder="District (EN)" onChange={(en) => setLoc(i, { district: { ...l.district, en } })} />
              <Text value={l.district.az} placeholder="Rayon (AZ)" onChange={(az) => setLoc(i, { district: { ...l.district, az } })} />
              <Text value={l.mapsQuery} placeholder={`Google Maps search, e.g. ${d.name || "Brand"} ${l.district.en || "District"} Baku`} onChange={(mapsQuery) => setLoc(i, { mapsQuery })} />
              <button type="button" className="ad-x" aria-label="Remove location" onClick={(e) => { e.stopPropagation(); set({ locations: locs.filter((_, n) => n !== i) }); setActive(0); }}>×</button>
            </div>
          ))}
          <Btn onClick={add}>+ Add location</Btn>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Texts ───────────── */

type TextRow = { key: string; en: string | null; az: string | null };
type KeyInfo = { key: string; section: string; az: string };

export function TextsPage() {
  const [over, setOver] = useState<Record<string, TextRow>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sec, setSec] = useState("All");
  const [onlyEdited, setOnlyEdited] = useState(false);
  const keys = TEXT_KEYS as KeyInfo[];
  const sections = useMemo(() => ["All", ...Array.from(new Set(keys.map((k) => k.section)))], [keys]);
  useEffect(() => {
    sb.from("texts").select("key,en,az").then(({ data, error }) => {
      if (error) toast(error.message, "err");
      setOver(Object.fromEntries((data ?? []).map((r: TextRow) => [r.key, r])));
      setLoading(false);
    });
  }, []);
  const list = keys.filter(
    (k) => (sec === "All" || k.section === sec) && (!onlyEdited || over[k.key]) && (!q || (k.key + " " + k.az + " " + (over[k.key]?.en ?? "") + " " + (over[k.key]?.az ?? "")).toLowerCase().includes(q.toLowerCase())),
  );
  const save = async (k: KeyInfo, en: string, az: string) => {
    const clean = { en: en.trim() && en.trim() !== k.key ? en.trim() : null, az: az.trim() && az.trim() !== k.az ? az.trim() : null };
    if (!clean.en && !clean.az) {
      if (!over[k.key]) return;
      const { error } = await sb.from("texts").delete().eq("key", k.key);
      if (error) return toast(error.message, "err");
      await markDeleted();
      notifyChanged();
      setOver(({ [k.key]: _, ...rest }) => rest);
      return toast("Back to the original text");
    }
    const row = { key: k.key, ...clean, updated_at: new Date().toISOString() };
    const { error } = await sb.from("texts").upsert(row);
    if (error) return toast(error.message, "err");
    setOver((o) => ({ ...o, [k.key]: row }));
    notifyChanged();
    toast("Saved");
  };
  return (
    <>
      <PageHead title="Section texts" sub="Every headline, label and paragraph on the site. Edit a field and click away to save; clear it to go back to the original." />
      <div className="ad-filters">
        <input className="ad-input" placeholder="Search text…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="ad-input" value={sec} onChange={(e) => setSec(e.target.value)}>
          {sections.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Toggle label={`Edited only (${Object.keys(over).length})`} checked={onlyEdited} onChange={setOnlyEdited} />
      </div>
      {loading ? <Loading /> : (
        <div className="ad-texts">
          {list.map((k) => <TextRowEdit key={k.key} k={k} o={over[k.key]} onSave={save} showSection={sec === "All"} />)}
          {!list.length && <Empty>Nothing matches.</Empty>}
        </div>
      )}
    </>
  );
}

function TextRowEdit({ k, o, onSave, showSection }: { k: KeyInfo; o?: TextRow; onSave: (k: KeyInfo, en: string, az: string) => void; showSection: boolean }) {
  const [en, setEn] = useState(o?.en ?? k.key);
  const [az, setAz] = useState(o?.az ?? k.az);
  useEffect(() => {
    setEn(o?.en ?? k.key);
    setAz(o?.az ?? k.az);
  }, [o, k]);
  const long = k.key.length > 70;
  const blur = () => (en !== (o?.en ?? k.key) || az !== (o?.az ?? k.az)) && onSave(k, en, az);
  const I = (p: { v: string; s: (v: string) => void }) =>
    long ? <textarea className="ad-input ad-area" rows={3} value={p.v} onChange={(e) => p.s(e.target.value)} onBlur={blur} /> : <input className="ad-input" value={p.v} onChange={(e) => p.s(e.target.value)} onBlur={blur} />;
  return (
    <div className={"ad-text" + (o ? " edited" : "")}>
      <div className="ad-text-meta">
        {showSection && <span className="ad-pill">{k.section}</span>}
        {o && <button type="button" className="ad-link" onClick={() => onSave(k, "", "")}>Reset</button>}
      </div>
      <div className="ad-bi">
        <div><span className="ad-lang">EN</span>{I({ v: en, s: setEn })}</div>
        <div><span className="ad-lang">AZ</span>{I({ v: az, s: setAz })}</div>
      </div>
    </div>
  );
}

/* ───────────── Sections ───────────── */

const SECTIONS: { id: string; name: string; sub: string }[] = [
  { id: "partners", name: "Sponsors", sub: "“Backed by our sponsors” grid under the hero" },
  { id: "how", name: "How it works", sub: "Three steps, the history card and features" },
  { id: "centers", name: "For service centers", sub: "Black band with “Become a partner”" },
  { id: "news", name: "News", sub: "“Latest from CarCat” carousel" },
  { id: "instagram-feed", name: "Follow strip", sub: "Instagram / socials banner" },
  { id: "team", name: "Team", sub: "Founding team cards" },
  { id: "partners-logos", name: "Partners strip", sub: "“Working with our partners” logos" },
  { id: "partners-centers", name: "Partners map", sub: "“Already on CarCat” map of service centers" },
];

export function SectionsPage() {
  const [hidden, setHidden] = useState<string[] | null>(null);
  useEffect(() => {
    sb.from("settings").select("value").eq("key", "hidden").maybeSingle().then(({ data }) => setHidden((data?.value as string[]) ?? []));
  }, []);
  const flip = async (id: string, show: boolean) => {
    const next = show ? hidden!.filter((h) => h !== id) : [...hidden!, id];
    setHidden(next);
    const { error } = await sb.from("settings").upsert({ key: "hidden", value: next, updated_at: new Date().toISOString() });
    if (error) toast(error.message, "err");
    else {
      notifyChanged();
      toast(show ? "Section will be shown" : "Section will be hidden");
    }
  };
  return (
    <>
      <PageHead title="Sections" sub="Hide a homepage section without deleting its content. The hero, header and footer are always shown." />
      {!hidden ? <Loading /> : (
        <div className="ad-list">
          {SECTIONS.map((s) => (
            <div key={s.id} className="ad-item static">
              <div className="ad-item-main"><strong>{s.name}</strong><span>{s.sub}</span></div>
              <Toggle label={hidden.includes(s.id) ? "Hidden" : "Shown"} checked={!hidden.includes(s.id)} onChange={(v) => flip(s.id, v)} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export const Loading = () => <div className="ad-loading"><span className="ad-spin" /> Loading…</div>;
export const Empty = ({ children }: { children: React.ReactNode }) => <div className="ad-empty">{children}</div>;

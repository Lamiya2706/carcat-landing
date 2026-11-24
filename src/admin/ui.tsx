import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { mediaUrl, sb, uploadImage } from "./supabase";

/** Fired after every save so the change list and the Publish badge stay current. */
export const notifyChanged = () => window.dispatchEvent(new Event("cms-changed"));

/** Deleted rows leave nothing behind to count, so record that something changed for the Publish badge. */
export const markDeleted = () => sb.from("settings").upsert({ key: "last_delete", value: new Date().toISOString(), updated_at: new Date().toISOString() });

export type Row = Record<string, any> & { sort: number };

/** Load, save, delete and reorder rows of one table. */
export function useTable<T extends Row>(table: string, key = "id", order = "sort") {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.from(table).select("*").order(order);
    if (error) setError(error.message);
    else setRows(data as T[]);
    setLoading(false);
  }, [table, order]);
  useEffect(() => void load(), [load]);

  const save = async (row: T, prevKey?: string) => {
    const { updated_at, ...clean } = row as any;
    clean.updated_at = new Date().toISOString();
    const q = prevKey && prevKey !== clean[key] ? sb.from(table).update(clean).eq(key, prevKey) : sb.from(table).upsert(clean);
    const { error } = await q;
    if (error) throw new Error(error.message);
    notifyChanged();
    await load();
  };
  const remove = async (id: string) => {
    const { error } = await sb.from(table).delete().eq(key, id);
    if (error) throw new Error(error.message);
    await markDeleted();
    notifyChanged();
    await load();
  };
  /** Swap a row with its neighbour and renumber the list. */
  const move = async (list: T[], i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    const now = new Date().toISOString();
    const updates = next.map((r, n) => ({ ...r, sort: n, updated_at: now })).filter((r, n) => list[n] !== next[n] || r.sort !== list[n].sort);
    setRows((all) => all.map((r) => updates.find((u) => u[key] === r[key]) ?? r).sort((a, b) => a.sort - b.sort));
    for (const u of updates) {
      const { error } = await sb.from(table).update({ sort: u.sort, updated_at: now }).eq(key, u[key]);
      if (error) setError(error.message);
    }
    notifyChanged();
  };
  return { rows, loading, error, setError, load, save, remove, move };
}

let toastFn: (msg: string, kind?: "ok" | "err") => void = () => {};
export const toast = (msg: string, kind: "ok" | "err" = "ok") => toastFn(msg, kind);
export function Toasts() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: string }[]>([]);
  toastFn = (msg, kind = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === "err" ? 6000 : 2800);
  };
  return (
    <div className="ad-toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={"ad-toast " + t.kind}>{t.msg}</div>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={"ad-field" + (wide ? " wide" : "")}>
      <span className="ad-label">{label}</span>
      {children}
      {hint && <span className="ad-hint">{hint}</span>}
    </label>
  );
}

export const Text = (p: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string }) => (
  <input className="ad-input" type={p.type ?? "text"} value={p.value ?? ""} placeholder={p.placeholder} required={p.required} onChange={(e) => p.onChange(e.target.value)} />
);

export const Area = (p: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <textarea className="ad-input ad-area" rows={p.rows ?? 4} value={p.value ?? ""} placeholder={p.placeholder} onChange={(e) => p.onChange(e.target.value)} />
);

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="ad-toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ad-switch" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

/** EN / AZ pair of inputs. */
export function Bilingual({ label, value, onChange, area, rows, hint }: { label: string; value: { en?: string; az?: string }; onChange: (v: { en: string; az: string }) => void; area?: boolean; rows?: number; hint?: string }) {
  const v = { en: value?.en ?? "", az: value?.az ?? "" };
  const I = area ? Area : Text;
  return (
    <div className="ad-field wide">
      <span className="ad-label">{label}</span>
      <div className="ad-bi">
        <div><span className="ad-lang">EN</span><I value={v.en} rows={rows} onChange={(en: string) => onChange({ ...v, en })} /></div>
        <div><span className="ad-lang">AZ</span><I value={v.az} rows={rows} onChange={(az: string) => onChange({ ...v, az })} /></div>
      </div>
      {hint && <span className="ad-hint">{hint}</span>}
    </div>
  );
}

export function ImagePick({ value, onChange, folder, label, contain, maxSide }: { value: string; onChange: (url: string) => void; folder: string; label: string; contain?: boolean; maxSide?: number }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, folder, maxSide));
    } catch (e: any) {
      toast("Upload failed: " + e.message, "err");
    }
    setBusy(false);
  };
  return (
    <div className="ad-field">
      <span className="ad-label">{label}</span>
      <div
        className={"ad-img" + (contain ? " contain" : "") + (busy ? " busy" : "")}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      >
        {value ? <img src={mediaUrl(value)} alt="" /> : <span>Drop an image or click to upload</span>}
        {busy && <span className="ad-spin" />}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] ?? undefined)} />
    </div>
  );
}

export function Btn({ kind = "ghost", children, ...p }: { kind?: "primary" | "ghost" | "danger" | "dark" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={"ad-btn " + kind} {...p}>
      {children}
    </button>
  );
}

export function Reorder({ onUp, onDown, first, last }: { onUp: () => void; onDown: () => void; first: boolean; last: boolean }) {
  return (
    <span className="ad-reorder">
      <button type="button" aria-label="Move up" disabled={first} onClick={onUp}>↑</button>
      <button type="button" aria-label="Move down" disabled={last} onClick={onDown}>↓</button>
    </span>
  );
}

/** Slide-over editor with Save / Delete; keeps a draft so Cancel throws changes away. */
export function Drawer<T>({ title, initial, onClose, onSave, onDelete, children }: { title: string; initial: T; onClose: () => void; onSave: (d: T) => Promise<void>; onDelete?: () => Promise<void>; children: (d: T, set: (patch: Partial<T>) => void) => ReactNode }) {
  const [d, setD] = useState<T>(initial);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<T>) => setD((x) => ({ ...x, ...patch }));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      onClose();
    } catch (e: any) {
      toast(e.message, "err");
    }
    setBusy(false);
  };
  return (
    <div className="ad-drawer-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="ad-drawer"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => onSave(d), "Saved");
        }}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" className="ad-x" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="ad-drawer-body">{children(d, set)}</div>
        <footer>
          {onDelete && (
            <Btn kind="danger" disabled={busy} onClick={() => confirm("Delete this? It disappears from the site on the next publish.") && run(onDelete, "Deleted")}>
              Delete
            </Btn>
          )}
          <span style={{ flex: 1 }} />
          <Btn onClick={onClose}>Cancel</Btn>
          <button type="submit" className="ad-btn primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </footer>
      </form>
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="ad-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="ad-head-actions">{children}</div>
    </div>
  );
}

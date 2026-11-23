// Everything the admin panel manages. At build time content.json is refreshed from Supabase
// (scripts/fetch-content.mjs); the committed copy is the fallback.
import raw from "./content/content.json";

export type L10n = { en: string; az: string };

export type NewsRow = {
  slug: string;
  /** ISO date, e.g. 2026-07-12 */
  date: string;
  image: string;
  fit: "cover" | "contain";
  alt: string;
  published: boolean;
  sort: number;
  en: { title: string; lead: string; body: string[] };
  az: { title: string; lead: string; body: string[] };
};

export type TeamRow = { id: string; name: string; photo: string; role: L10n; linkedin: string; visible: boolean; sort: number };

export type OrgRow = {
  id: string;
  kind: "sponsor" | "partner";
  name: string;
  logo: string;
  url: string;
  scale?: number;
  tall?: boolean;
  visible: boolean;
  sort: number;
};

export type CenterLocation = { district: L10n; x: number; y: number; mapsQuery: string };
export type CenterRow = {
  id: string;
  name: string;
  logo: string;
  category: L10n;
  soon: boolean;
  locations: CenterLocation[];
  visible: boolean;
  sort: number;
};

export type Content = {
  news: NewsRow[];
  team: TeamRow[];
  orgs: OrgRow[];
  centers: CenterRow[];
  /** Text overrides keyed by the English source string used in t("…") */
  texts: Record<string, Partial<L10n>>;
  /** Section ids hidden from the homepage */
  hidden: string[];
  /** When this content was published; the live check compares it with the latest snapshot */
  version?: string;
};

export let CONTENT = raw as Content;

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

/** Uploaded files are absolute URLs (Supabase Storage); seed files live in public/media. */
export const media = (ref: string) => (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:") ? ref : import.meta.env.BASE_URL + "media/" + ref);

// `let` exports are live bindings: after applyContent() every importer sees the new lists on its next render.
export let TEAM: TeamRow[] = [];
export let SPONSORS: OrgRow[] = [];
export let PARTNERS: OrgRow[] = [];
export let CENTERS: CenterRow[] = [];
const derive = () => {
  TEAM = CONTENT.team.filter((m) => m.visible).sort(bySort);
  SPONSORS = CONTENT.orgs.filter((o) => o.visible && o.kind === "sponsor").sort(bySort);
  PARTNERS = CONTENT.orgs.filter((o) => o.visible && o.kind === "partner").sort(bySort);
  CENTERS = CONTENT.centers.filter((c) => c.visible).sort(bySort);
};
derive();
export const isShown = (section: string) => !CONTENT.hidden.includes(section);

const listeners = new Set<() => void>();
export const onContentChange = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export function applyContent(next: Content) {
  CONTENT = next;
  derive();
  listeners.forEach((fn) => fn());
}

const MONTHS_AZ = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const formatDate = (iso: string, lang: "en" | "az") => {
  const [y, m, d] = iso.split("-").map(Number);
  return lang === "az" ? `${d} ${MONTHS_AZ[m - 1]} ${y}` : `${MONTHS_EN[m - 1]} ${d}, ${y}`;
};

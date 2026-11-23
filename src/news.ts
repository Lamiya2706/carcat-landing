import { CONTENT, formatDate, media, onContentChange } from "./content";

export type NewsItem = {
  slug: string;
  image: string;
  /** "cover" for photos, "contain" for logos/documents */
  fit: "cover" | "contain";
  alt: string;
  iso: string;
  en: { date: string; title: string; lead: string; body: string[] };
  az: { date: string; title: string; lead: string; body: string[] };
};

// Order matches the homepage carousel (admin "sort"); unpublished posts are left out entirely.
const build = (): NewsItem[] => CONTENT.news
  .filter((n) => n.published)
  .sort((a, b) => a.sort - b.sort)
  .map((n) => ({
    slug: n.slug,
    image: media(n.image),
    fit: n.fit,
    alt: n.alt,
    iso: n.date,
    en: { ...n.en, date: formatDate(n.date, "en") },
    az: { ...n.az, date: formatDate(n.date, "az") },
  }));
export let NEWS: NewsItem[] = build();
onContentChange(() => (NEWS = build()));

export const newsUrl = (slug: string) => `${import.meta.env.BASE_URL}news/${slug}/`;

export type Route =
  | { page: "home" }
  | { page: "news"; slug: string }
  | { page: "newsIndex" }
  | { page: "legal"; doc: "privacy" | "terms" };

/** Route for a path relative to the site root, e.g. "/news/x/". Unknown paths fall back to home. */
export const routeFor = (rel: string): Route => {
  const p = rel.replace(/\/+$/, "") || "/";
  if (p === "/news") return { page: "newsIndex" };
  if (p === "/privacy-policy") return { page: "legal", doc: "privacy" };
  if (p === "/terms-of-service") return { page: "legal", doc: "terms" };
  const m = p.match(/^\/news\/([a-z0-9-]+)$/);
  if (m && NEWS.some((n) => n.slug === m[1])) return { page: "news", slug: m[1] };
  return { page: "home" };
};

export const currentRoute = (): Route => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return routeFor(window.location.pathname.slice(base.length) || "/");
};

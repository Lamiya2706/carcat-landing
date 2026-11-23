import { useEffect } from "react";
import Shell, { home } from "./Shell";
import { NEWS, newsUrl, type NewsItem } from "./news";

type Lang = "en" | "az";

function NewsCard({ n, lang }: { n: NewsItem; lang: Lang }) {
  const m = n[lang];
  return (
    <a href={newsUrl(n.slug)} className="nd-card">
      <div className={"nd-card-img" + (n.fit === "contain" ? " contain" : "")}>
        <img src={n.image} alt="" loading="lazy" decoding="async" />
      </div>
      <span>{m.date}</span>
      <h3>{m.title}</h3>
    </a>
  );
}

export default function NewsPage({ slug }: { slug: string }) {
  const item = NEWS.find((n) => n.slug === slug)!;
  useEffect(() => window.scrollTo(0, 0), [slug]);
  return (
    <Shell title={`${item.en.title} — CarCat`}>
      {({ v, t }) => {
        const lang = v.lang as Lang;
        const c = item[lang];
        return (
          <>
            <article className="nd-wrap nd-article">
              <a href={home + "news/"} className="nd-back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                {t("All news")}
              </a>
              <span className="nd-kicker">
                {t("Newsroom")} · <time dateTime={new Date(item.en.date + " UTC").toISOString().slice(0, 10)}>{c.date}</time>
              </span>
              <h1>{c.title}</h1>
              <p className="nd-lead">{c.lead}</p>
              <div className={"nd-hero" + (item.fit === "contain" ? " contain" : "")}>
                <img src={item.image} alt={c.title} />
              </div>
              <div className="nd-body">
                {c.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="nd-cta">
                <div>
                  <strong>{t("Get CarCat")}</strong>
                  <span>{t("Your car's maintenance plan, service bookings and full history, in one simple app. Built for drivers in Azerbaijan.")}</span>
                </div>
                <a href={home + "get/"} className="nd-cta-btn">{t("Download")}</a>
              </div>
            </article>
            <section className="nd-wrap nd-more" aria-label={t("More news")}>
              <h2>{t("More news")}</h2>
              <div className="nd-more-grid">
                {NEWS.filter((n) => n.slug !== slug).map((n) => (
                  <NewsCard key={n.slug} n={n} lang={lang} />
                ))}
              </div>
            </section>
          </>
        );
      }}
    </Shell>
  );
}

export function NewsIndex() {
  const sorted = [...NEWS].sort((a, b) => +new Date(b.en.date) - +new Date(a.en.date));
  return (
    <Shell title="News — CarCat">
      {({ v, t }) => (
        <section className="nd-wrap nd-index">
          <span className="nd-kicker">{t("Newsroom")}</span>
          <h1>{t("Latest from CarCat")}</h1>
          <div className="nd-index-grid">
            {sorted.map((n) => (
              <NewsCard key={n.slug} n={n} lang={v.lang as Lang} />
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

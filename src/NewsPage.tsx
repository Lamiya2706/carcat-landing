import { useEffect } from "react";
import { useLanding } from "./useLanding";
import { NEWS, newsUrl } from "./news";
import logo from "./assets/carcat-logo.png";

const home = import.meta.env.BASE_URL;

export default function NewsPage({ slug }: { slug: string }) {
  const { v, t } = useLanding();
  const item = NEWS.find((n) => n.slug === slug)!;
  const c = item[v.lang as "en" | "az"];
  const more = NEWS.filter((n) => n.slug !== slug);

  useEffect(() => {
    document.title = `${c.title} — CarCat`;
    window.scrollTo(0, 0);
  }, [c.title]);

  return (
    <div className={v.rootCls + " nd-root"}>
      <header className="nd-hdr">
        <div className="nd-wrap nd-hdr-in">
          <a href={home} aria-label="CarCat home" className="nd-logo">
            <img src={logo} className="cc-logo" alt="CarCat, always ready to drive" />
          </a>
          <nav className="nd-nav" aria-label="Main">
            <a href={home + "#how"}>{t("How it works")}</a>
            <a href={home + "#centers"}>{t("For service centers")}</a>
            <a href={home + "#news"}>{t("News")}</a>
            <a href={home + "#team"}>{t("Team")}</a>
          </nav>
          <div className="nd-tools">
            <div className="nd-lang" role="group" aria-label="Language">
              {(["en", "az"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={v.lang === l} className={v.lang === l ? "on" : ""} onClick={() => v.setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" className="nd-theme" onClick={v.toggleDark} aria-label={v.themeLabel} title={v.themeLabel}>
              {v.isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <article className="nd-wrap nd-article">
          <a href={home + "#news"} className="nd-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            {t("All news")}
          </a>
          <span className="nd-kicker">{t("Newsroom")} · {c.date}</span>
          <h1>{c.title}</h1>
          <p className="nd-lead">{c.lead}</p>
          <div className={"nd-hero" + (item.fit === "contain" ? " contain" : "")}>
            <img src={item.image} alt="" />
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
            {more.map((n) => {
              const m = n[v.lang as "en" | "az"];
              return (
                <a key={n.slug} href={newsUrl(n.slug)} className="nd-card">
                  <div className={"nd-card-img" + (n.fit === "contain" ? " contain" : "")}>
                    <img src={n.image} alt="" />
                  </div>
                  <span>{m.date}</span>
                  <h3>{m.title}</h3>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="nd-foot">
        <div className="nd-wrap">
          <span>{t("© 2026 CARCAT MMC. All rights reserved.")}</span>
          <a href={home}>carcat.app</a>
        </div>
      </footer>
    </div>
  );
}

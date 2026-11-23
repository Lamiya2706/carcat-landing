import { useEffect, type ReactNode } from "react";
import { useLanding } from "./useLanding";
import logo from "./assets/carcat-logo.png";

export const home = import.meta.env.BASE_URL;

type Landing = ReturnType<typeof useLanding>;

/** Header + footer used by every page other than the homepage. */
export default function Shell({ title, children }: { title: string; children: (l: Landing) => ReactNode }) {
  const l = useLanding();
  const { v, t } = l;

  useEffect(() => {
    document.title = title;
  }, [title]);

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
            <a href={home + "news/"}>{t("News")}</a>
            <a href={home + "#team"}>{t("Team")}</a>
          </nav>
          <div className="nd-tools">
            <div className="nd-lang" role="group" aria-label="Language">
              {(["en", "az"] as const).map((lang) => (
                <button key={lang} type="button" aria-pressed={v.lang === lang} className={v.lang === lang ? "on" : ""} onClick={() => v.setLang(lang)}>
                  {lang.toUpperCase()}
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

      <main>{children(l)}</main>

      <footer className="nd-foot">
        <div className="nd-wrap">
          <span>{t("© 2026 CARCAT MMC. All rights reserved.")}</span>
          <span className="nd-foot-links">
            <a href={home + "privacy-policy/"}>{t("Privacy Policy")}</a>
            <a href={home + "terms-of-service/"}>{t("Terms of Service")}</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

// GitHub Pages lets browsers reuse a page for up to 10 minutes. After a new deploy, a cached page still
// runs the old code, so compare our own bundle with the latest version.json and reload once if it changed.
export function reloadIfStale(which: "main" | "admin") {
  if (typeof window === "undefined" || import.meta.env.DEV) return;
  // the entry script the (possibly cached) HTML points at
  const src = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src ?? "";
  const mine = src.split("/").pop();
  fetch(import.meta.env.BASE_URL + "version.json?t=" + Date.now(), { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      const latest = v?.[which];
      const flag = "cc-reloaded-for-" + latest;
      if (!latest || latest === mine || sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      location.reload();
    })
    .catch(() => {});
}

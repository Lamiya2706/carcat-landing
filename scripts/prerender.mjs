// Runs after `vite build` + the SSR build. Writes a fully rendered, SEO-tagged HTML file per route,
// plus sitemap.xml, robots.txt and 404.html.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dist = path.resolve("dist");
const base = process.env.BASE_PATH ?? "/carcat-landing/";
const site = (process.env.SITE_URL ?? "https://lamiya2706.github.io/carcat-landing").replace(/\/$/, "");
const { render, NEWS, SITE: S } = await import(pathToFileURL(path.resolve("dist-ssr/entry-server.js")).href);
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const abs = (p) => site + "/" + p.replace(/^\/+/, "");
const toIso = (d) => new Date(d + " UTC").toISOString().slice(0, 10);

const org = {
  "@type": "Organization", "@id": abs("#org"), name: S.name, legalName: S.legalName, url: abs(""),
  logo: abs("icons/icon-512.png"), email: S.email, sameAs: S.sameAs,
  contactPoint: { "@type": "ContactPoint", telephone: S.phone, contactType: "customer support", areaServed: "AZ", availableLanguage: ["az", "en"] },
};

function page({ route, title, description, image, type, jsonld, html }) {
  const url = abs(route);
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="index,follow,max-image-preview:large" />`,
    `<meta property="og:site_name" content="CarCat" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:locale:alternate" content="az_AZ" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="apple-itunes-app" content="app-id=6756967222" />`,
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": jsonld }).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta name="description"[^>]*>\s*/, "")
    .replace(/<meta property="og:[^>]*>\s*/g, "")
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
}

const write = (route, html) => {
  const file = path.join(dist, route, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

// Home
write("", page({
  route: "", title: S.title, description: S.description, image: abs("og/home.jpg"), type: "website",
  html: render("/"),
  jsonld: [
    org,
    { "@type": "WebSite", "@id": abs("#website"), url: abs(""), name: S.name, publisher: { "@id": abs("#org") }, inLanguage: ["en", "az"] },
    { "@type": "MobileApplication", name: S.name, operatingSystem: "iOS, Android", applicationCategory: "LifestyleApplication",
      description: S.description, offers: { "@type": "Offer", price: "0", priceCurrency: "AZN" },
      installUrl: [S.appStore, S.playStore], publisher: { "@id": abs("#org") } },
  ],
}));

// News articles
// Share image: a prepared 1200x630 card in public/og if there is one, otherwise the post's own cover.
const ogFor = (n) => fs.existsSync(path.resolve("public/og", `${n.slug}.jpg`)) ? abs(`og/${n.slug}.jpg`) : (/^https?:/.test(n.image) ? n.image : abs(n.image.slice(base.length)));
for (const n of NEWS) {
  const route = `news/${n.slug}/`;
  write(route, page({
    route, title: `${n.en.title} — CarCat`, description: n.en.lead, image: ogFor(n), type: "article",
    html: render("/" + route),
    jsonld: [org, { "@type": "NewsArticle", headline: n.en.title, description: n.en.lead, image: [ogFor(n)],
      datePublished: n.iso, dateModified: n.iso, inLanguage: "en",
      mainEntityOfPage: abs(route), author: { "@id": abs("#org") }, publisher: { "@id": abs("#org") } }],
  }));
}

// News index + legal pages (legal URLs match the previous carcat.app site, so app-store links keep working)
write("news/", page({
  route: "news/", title: "News — CarCat", description: "Latest news from CarCat: awards, partnerships and product updates.",
  image: abs("og/home.jpg"), type: "website", html: render("/news/"),
  jsonld: [org, { "@type": "CollectionPage", name: "CarCat news", url: abs("news/") }],
}));
for (const [route, title, description] of [
  ["privacy-policy/", "Privacy Policy — CarCat", "How CarCat collects, uses, stores and protects your personal and vehicle information."],
  ["terms-of-service/", "Terms and Conditions — CarCat", "The terms that govern your use of the CarCat app and related services."],
]) {
  write(route, page({ route, title, description, image: abs("og/home.jpg"), type: "website", html: render("/" + route), jsonld: [org] }));
}

// sitemap + robots
const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: abs(""), lastmod: today, pri: "1.0" }, { loc: abs("news/"), lastmod: today, pri: "0.6" }, { loc: abs("privacy-policy/"), lastmod: "2025-12-25", pri: "0.3" }, { loc: abs("terms-of-service/"), lastmod: "2025-12-25", pri: "0.3" }, ...NEWS.map((n) => ({ loc: abs(`news/${n.slug}/`), lastmod: n.iso, pri: "0.7" }))];
fs.writeFileSync(path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.pri}</priority></url>`).join("\n") + `\n</urlset>\n`);
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: ${base}get/\nDisallow: ${base}admin/\n\nSitemap: ${abs("sitemap.xml")}\n`);

// 404: send visitors to the homepage
fs.writeFileSync(path.join(dist, "404.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found — CarCat</title>` +
  `<meta http-equiv="refresh" content="0; url=${base}"><link rel="canonical" href="${abs("")}"></head>` +
  `<body><p>Page not found. <a href="${base}">Go to CarCat</a></p></body></html>`);
console.log("prerendered", urls.length, "pages for", site);
